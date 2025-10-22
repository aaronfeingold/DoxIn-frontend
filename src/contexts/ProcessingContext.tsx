"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { clientConfig } from "@/config/client";

interface ProcessingOptions {
  auto_save?: boolean;
  cleanup?: boolean;
  model_provider?: "openai" | "anthropic";
  confidence_threshold?: number;
  human_in_loop?: boolean;
}

interface ProcessingJob {
  task_id: string;
  filename: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  result?: any;
  error?: string;
}

interface ProcessingContextType {
  jobs: Map<string, ProcessingJob>;
  startBatchProcessing: (
    files: File[],
    options: ProcessingOptions
  ) => Promise<string[]>;
  cancelJob: (taskId: string) => Promise<void>;
  isConnected: boolean;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(
  undefined
);

export function ProcessingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jobs, setJobs] = useState<Map<string, ProcessingJob>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize websocket connection
  useEffect(() => {
    const socket = io(clientConfig.apiUrl, {
      transports: ["polling", "websocket"], // Try polling first, then upgrade
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      upgrade: true,
      rememberUpgrade: true,
      path: "/socket.io",
      forceNew: true,
    });

    // Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (!socket.connected) {
        toast.error(
          "Backend connection failed. Please ensure the API server is running.",
          { duration: 5000 }
        );
      }
    }, 5000);

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      toast.success("Connected to processing server");
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      toast.warning("Disconnected from processing server");
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
    });

    // Listen for joined_task confirmation
    socket.on("joined_task", (data: any) => {
      console.log("Successfully joined task room:", data);
    });

    // Listen for task updates (backend uses 'task_update' event)
    socket.on("task_update", (data: any) => {
      console.log("Received task_update:", data);
      const { task_id, type, status, progress, result, error, filename } = data;

      setJobs((prev) => {
        const updated = new Map(prev);
        const job = updated.get(task_id);

        if (!job) {
          console.warn(`Received update for unknown task: ${task_id}`);
          return prev;
        }

        // Map backend 'type' to frontend 'status'
        let jobStatus = job.status;
        if (type === "complete") {
          jobStatus = "completed";
        } else if (type === "error") {
          jobStatus = "failed";
        } else if (type === "progress" || type === "stage_start") {
          jobStatus = "processing";
        }

        // For progress updates, ensure progress is a number between 0-100
        let updatedProgress = job.progress;
        if (progress !== undefined && progress !== null) {
          updatedProgress = Math.min(100, Math.max(0, progress));
        }

        // If completed, set progress to 100
        if (jobStatus === "completed") {
          updatedProgress = 100;
        }

        const updatedJob = {
          ...job,
          status: jobStatus,
          progress: updatedProgress,
          result: result || job.result,
          error: error || job.error,
        };

        console.log(`Updating job ${task_id}:`, updatedJob);
        updated.set(task_id, updatedJob);
        return updated;
      });
    });

    socketRef.current = socket;

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, []);

  const uploadToVercelBlob = async (
    file: File
  ): Promise<{ blob_url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const { url } = await response.json();

    return { blob_url: url };
  };

  const startBatchProcessing = useCallback(
    async (files: File[], options: ProcessingOptions) => {
      if (!socketRef.current?.connected) {
        toast.error("WebSocket not connected. Please try again.");
        throw new Error("WebSocket not connected");
      }

      try {
        toast.info(
          `Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`
        );

        // Upload all files to Vercel Blob
        const uploadPromises = files.map(async (file) => {
          const { blob_url } = await uploadToVercelBlob(file);
          return {
            blob_url,
            filename: file.name,
            file_size: file.size,
            mime_type: file.type,
          };
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        // Send batch processing request to backend
        const response = await fetch(
          `${clientConfig.apiUrl}/api/v1/invoices/process-batch`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Include cookies for auth
            body: JSON.stringify({
              files: uploadedFiles,
              options,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to start batch processing"
          );
        }

        const { task_ids } = await response.json();

        // Initialize jobs in state
        setJobs((prev) => {
          const updated = new Map(prev);
          task_ids.forEach((task_id: string, index: number) => {
            console.log(
              `Initializing job for task ${task_id}: ${files[index].name}`
            );
            updated.set(task_id, {
              task_id,
              filename: files[index].name,
              status: "pending",
              progress: 0,
            });

            // Join the websocket room for this task (backend uses 'join_task')
            console.log(`Joining websocket room for task: ${task_id}`);
            socketRef.current?.emit("join_task", { task_id });
          });
          return updated;
        });

        // Return task_ids so the modal can track them
        return task_ids;
      } catch (error) {
        console.error("Batch processing error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to start processing"
        );
        throw error;
      }
    },
    []
  );

  const cancelJob = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(
        `${clientConfig.apiUrl}/api/jobs/${taskId}/cancel`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel job");
      }

      setJobs((prev) => {
        const updated = new Map(prev);
        const job = updated.get(taskId);
        if (job) {
          updated.set(taskId, {
            ...job,
            status: "failed",
            error: "Cancelled by user",
          });
        }
        return updated;
      });

      toast.info("Job cancelled");
    } catch (error) {
      console.error("Cancel job error:", error);
      toast.error("Failed to cancel job");
    }
  }, []);

  const value: ProcessingContextType = {
    jobs,
    startBatchProcessing,
    cancelJob,
    isConnected,
  };

  return (
    <ProcessingContext.Provider value={value}>
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error("useProcessing must be used within a ProcessingProvider");
  }
  return context;
}
