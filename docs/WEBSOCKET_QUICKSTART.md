# WebSocket Integration - Quick Start Guide

## TL;DR

The frontend connects **directly to Flask WebSocket** for real-time invoice processing updates, bypassing Next.js for long-running operations.

```typescript
// 1. Upload files to blob (via Next.js)
const blobs = await uploadToBlob(files);

// 2. WebSocket connects on mount (persistent)
const { isConnected, files, startBatchProcessing } = useAsyncProcessing();

// 3. Trigger Flask processing (direct HTTP)
await startBatchProcessing(files, { auto_save: true });

// 4. Real-time updates via WebSocket
files.forEach(file => {
  console.log(file.filename, file.progress, file.stage);
  // Updates automatically from Flask
});
```

---

## Architecture Overview

```
Browser → Next.js /api/upload → Vercel Blob ✅
   ↓
Browser → WebSocket → Flask (persistent connection) ✅
   ↓
Browser → Flask /api/invoices/upload (direct HTTP) ✅
   ↓
Flask → Celery Worker → LLM Processing
   ↓
WebSocket → Browser (real-time updates) ✅
```

**Key Point**: Next.js is **only** used for blob upload. Everything else is direct browser ↔ Flask.

---

## Using the Components

### Basic Usage

```typescript
import { DocumentUpload } from "@/components/DocumentUpload";

export default function UploadPage() {
  return (
    <DocumentUpload
      maxFiles={10}
      onUploadComplete={(results) => {
        console.log("All files processed:", results);
      }}
    />
  );
}
```

### Custom Implementation

```typescript
import { useAsyncProcessing } from "@/hooks/useAsyncProcessing";
import { processingApi } from "@/lib/api";

function MyUploadComponent() {
  const { isConnected, files, startBatchProcessing } = useAsyncProcessing();

  const handleUpload = async (selectedFiles: File[]) => {
    // Start processing (handles blob upload + Flask trigger + WebSocket join)
    await startBatchProcessing(selectedFiles, {
      auto_save: true,
      confidence_threshold: 0.8,
      model_provider: "openai",
    });
  };

  return (
    <div>
      {/* Show connection status */}
      <div>WebSocket: {isConnected ? "✅ Connected" : "❌ Disconnected"}</div>

      {/* Show processing files */}
      {files.map((file) => (
        <div key={file.task_id}>
          <span>{file.filename}</span>
          <span>{file.status}</span>
          <span>{file.stage}</span>
          <progress value={file.progress} max={100} />
        </div>
      ))}
    </div>
  );
}
```

---

## API Reference

### `useAsyncProcessing()`

**Returns:**
```typescript
{
  isConnected: boolean;              // WebSocket connection status
  files: FileProcessingState[];      // Array of processing files
  filesMap: Map<string, FileProcessingState>; // Direct lookup
  startBatchProcessing: (files, opts) => Promise<string[]>;
  startSingleProcessing: (file, opts) => Promise<string>;
  resetProcessing: () => void;
}
```

**FileProcessingState:**
```typescript
{
  task_id: string;                   // Unique task identifier
  filename: string;                  // Original filename
  status: "pending" | "processing" | "completed" | "error";
  progress: number;                  // 0-100
  stage: string;                     // "fetch" | "llm_extraction" | "validation" | "save"
  updates: ProcessingUpdate[];       // All WebSocket updates
  result: any;                       // Final result (when completed)
  error: string | null;              // Error message (if failed)
}
```

### `flaskClient`

```typescript
import { flaskClient } from "@/lib/flask-client";

// Trigger processing
const response = await flaskClient.triggerInvoiceProcessing(
  "https://blob.com/file.pdf",
  "invoice-001.pdf",
  { auto_save: true, confidence_threshold: 0.8 }
);

// Check status
const status = await flaskClient.getProcessingStatus(taskId);
```

### `processingApi`

```typescript
import { processingApi } from "@/lib/api";

// Upload single file + trigger processing
const { task_id, websocket_room } = await processingApi.uploadAndProcess(file, {
  auto_save: true,
  model_provider: "openai"
});

// Upload multiple files + trigger batch processing
const results = await processingApi.uploadAndProcessBatch(files, {
  auto_save: true,
  confidence_threshold: 0.8
});
```

---

## WebSocket Events

### Events You Receive

**1. Connection Events**
```typescript
socket.on("connect", () => {
  console.log("Connected to Flask WebSocket");
});

socket.on("disconnect", () => {
  console.log("Disconnected from Flask WebSocket");
});
```

**2. Task Updates**
```typescript
socket.on("task_update", (data) => {
  console.log(data);
  // {
  //   type: "progress" | "stage_start" | "stage_complete" | "error" | "complete",
  //   task_id: "task_xyz",
  //   progress: 50,
  //   stage: "llm_extraction",
  //   message: "Analyzing invoice with AI...",
  //   timestamp: 1234567890
  // }
});
```

**3. Room Join Confirmation**
```typescript
socket.on("joined_task", (data) => {
  console.log("Joined room:", data.task_id);
});
```

### Events You Send

```typescript
// Join a task room
socket.emit("join_task", { task_id: "task_xyz" });

// Leave a task room
socket.emit("leave_task", { task_id: "task_xyz" });
```

---

## Processing Stages

The backend sends updates through these stages:

| Stage | Progress | Description |
|-------|----------|-------------|
| `fetch` | 5-10% | Downloading image from blob URL |
| `llm_extraction` | 10-80% | AI extracting invoice data |
| `validation` | 80-90% | Validating extracted data |
| `save` | 90-95% | Saving to database (if auto_save) |
| `complete` | 100% | Processing finished |

**Example Timeline:**
```
00:00 - fetch: "Downloading image..."           (5%)
00:02 - llm_extraction: "Analyzing with AI..."  (30%)
00:08 - llm_extraction: "Extracting fields..."  (60%)
00:12 - validation: "Validating data..."        (85%)
00:14 - save: "Saving to database..."           (95%)
00:15 - complete: "Processing complete!"        (100%)
```

---

## Error Handling

### Network Errors

```typescript
const { isConnected, files } = useAsyncProcessing();

// Check connection before upload
if (!isConnected) {
  alert("WebSocket not connected. Please refresh.");
  return;
}
```

### Processing Errors

```typescript
files.forEach((file) => {
  if (file.status === "error") {
    console.error(`${file.filename} failed:`, file.error);
    // Show error to user
    // Optionally retry
  }
});
```

### Upload Errors

```typescript
try {
  await startBatchProcessing(files);
} catch (error) {
  console.error("Upload failed:", error);
  // Handle: show error message, retry, etc.
}
```

---

## Environment Setup

### Frontend `.env`

```bash
# Flask API URL for direct browser → Flask communication
NEXT_PUBLIC_FLASK_API_URL=http://localhost:5000

# Next.js API URL (for blob upload)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Backend Setup

**1. Start Flask**
```bash
cd backend/api
python app.py
```

**2. Start Celery Worker**
```bash
cd backend/api
celery -A app.celery worker --loglevel=info
```

**3. Start Redis**
```bash
redis-server
```

---

## Testing

### Manual Test

1. Start backend services (Flask, Celery, Redis)
2. Start frontend: `npm run dev`
3. Navigate to upload page
4. Check: "Connected" status shows
5. Select 3 files
6. Click "Upload & Process All"
7. Watch real-time progress bars
8. Check browser console for logs

### Expected Console Output

```javascript
// Initial
Connected to Flask WebSocket server

// After upload
Starting batch processing: 3 files
API Request: POST /api/upload
API Request: POST /api/invoices/upload
Joined task room: task_abc123

// During processing
Task update received: { type: "progress", task_id: "task_abc123", progress: 30, ... }
Task update received: { type: "progress", task_id: "task_abc123", progress: 60, ... }
Task update received: { type: "complete", task_id: "task_abc123", progress: 100, ... }
```

---

## Common Issues

### ❌ "WebSocket not connected"

**Problem**: Flask API not running or CORS issue

**Solution**:
```bash
# Check Flask is running
curl http://localhost:5000/api/health

# Check CORS in Flask config
# app/__init__.py:
CORS(app, origins=['http://localhost:3000'], supports_credentials=True)
```

### ❌ No progress updates

**Problem**: Celery worker not running or Redis down

**Solution**:
```bash
# Check Celery worker
celery -A app.celery inspect active

# Check Redis
redis-cli ping  # Should return PONG
```

### ❌ Upload fails immediately

**Problem**: Vercel Blob token invalid or file too large

**Solution**:
- Check `BLOB_READ_WRITE_TOKEN` in `.env`
- Verify file size < 10MB
- Check file type is allowed (PDF, PNG, JPG, etc.)

---

## Performance Tips

### Parallel Processing

With 4 Celery workers, 10 images process in ~3 rounds:
- Round 1: Images 1-4 (parallel)
- Round 2: Images 5-8 (parallel)
- Round 3: Images 9-10 (parallel)

**To add more workers**:
```bash
celery -A app.celery worker --concurrency=8
```

### Reduce Upload Time

Upload files in parallel:
```typescript
// Already handled by processingApi.uploadAndProcessBatch()
const blobs = await Promise.all(files.map(file => uploadToBlob(file)));
```

---

## Next Steps

- [ ] Read full architecture doc: `docs/architecture/websocket-integration.md`
- [ ] Review Flask endpoint: `backend/api/app/routes/invoices.py`
- [ ] Review Celery task: `backend/api/app/services/async_processor.py`
- [ ] Test batch upload with 10 files
- [ ] Monitor Celery worker logs during processing

---

## Support

**Issues**: Check `docs/architecture/websocket-integration.md` "Troubleshooting" section

**Logs**:
- Browser: DevTools Console
- Flask: Terminal running `app.py`
- Celery: Terminal running `celery worker`
- Redis: `redis-cli monitor`