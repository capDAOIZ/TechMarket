import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./shared/components/AppLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { JobsPage } from "./features/jobs/JobsPage";
import { JobDetailPage } from "./features/job-detail/JobDetailPage";
import { TrendsPage } from "./features/trends/TrendsPage";
import { PipelineRunsPage } from "./features/pipeline-runs/PipelineRunsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/pipeline-runs" element={<PipelineRunsPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
