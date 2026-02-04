ADMIN_PROCESS_SPEC.md - Admin Image Processing UI

1. Objective: "Visibility into the Queue"
Because industrial uploads involve raw, high-resolution photos that are processed asynchronously, the Admin needs a dedicated view to monitor the transformation from Raw Upload to Web-Optimized Product.

2. The "Process" Carousel Anatomy
The carousel is a specialized component within the Admin Product Manager that visualizes the pipeline defined in Phase 1.

A. Stage 1: The Raw Input (Immediate)
Action: As soon as the user drops a file, the browser shows a local preview.
UI Status: "Uploading..." overlay with a progress bar.

B. Stage 2: The Optimization Loop (Polling)
Action: Backend returns task_id; the frontend begins polling every 2 seconds.
UI Status: A Skeleton Loading Carousel replaces the raw preview.
Visual: A pulsing "Processing WebP & Thumbnails" message.

C. Stage 3: The Verified Output (Success)
Action: Task status returns SUCCESS.
UI Status: The final optimized WebP image fades in.
Metadata: Displays final file size reduction (e.g., "10MB → 145KB") to reassure the Admin of performance gains.

3. Component Specification (React/Tailwind)
Feature: Grid Layout
Requirement: Horizontal scrollable row of cards.

Feature: Feedback Loop
Requirement: Use TanStack Query for polling the task_id.

Feature: Error Handling
Requirement: If status is FAILED, show a "Retry" button and error log (requires backend support for retry endpoint).

Feature: Visual Style
Requirement: Slate-900 backgrounds for contrast against raw industrial photos.

4. Implementation Code Snippet
TypeScript
const ImageProcessCard = ({ taskId, rawPreview }) => {
  const { data: taskStatus } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTaskStatus(taskId),
    refetchInterval: (data) => (data?.status === 'SUCCESS' ? false : 2000), // Polling logic
  });

  return (
    <div className="relative w-48 h-48 border border-slate-200 bg-slate-900 rounded">
      {taskStatus?.status !== 'SUCCESS' ? (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <Spinner className="text-orange-500 mb-2" />
          <span className="text-[10px] font-mono text-slate-400">OPTIMIZING...</span>
        </div>
      ) : (
        <img src={taskStatus.thumb_url} className="w-full h-full object-cover" alt="Processed" />
      )}
    </div>
  );
};

5. Backend Alignment Notes
- Task status values (backend): PENDING, IN_PROGRESS, COMPLETED, FAILED.
- Cancel task requires a backend endpoint (not yet specified).
- Product publish status should be derived from backend product status rather than forced by UI.

6. Acceptance Criteria
[ ] UI remains responsive (< 200ms interaction) during heavy 10MB uploads.
[ ] Failure states provide a visible error path (retry if supported).
[ ] Product status reflects backend truth (PUBLISHED only when backend updates status).
