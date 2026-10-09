import { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';

const SubmissionHistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    if (!problemId) return;
    let cancelled = false;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/problem/submittedProblem/${problemId}`);
        if (cancelled) return;
        setSubmissions(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err.response?.data?.message || 'Failed to fetch submission history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSubmissions();
    return () => {
      cancelled = true;
    };
  }, [problemId]);

  // Updated to match your exact backend Judge0 statuses
  const getStatusColor = (status) => {
    if (!status) return 'badge-neutral';
    switch (status.toLowerCase()) {
      case 'accepted': return 'badge-success';
      case 'wrong answer': return 'badge-error';
      case 'compilation error': return 'badge-error';
      case 'runtime error': return 'badge-warning';
      case 'time limit exceeded': return 'badge-warning';
      case 'pending': return 'badge-info';
      case 'memory limit exceeded': return 'badge-warning';
      default: return 'badge-neutral';
    }
  };

  const formatMemory = (memory) => {
    if (!memory) return 'N/A';
    if (memory < 1024) return `${memory} kB`;
    return `${(memory / 1024).toFixed(2)} MB`;
  };

  const formatRuntime = (runtime) => {
    const value = Number(runtime);
    return value > 0 ? `${value.toFixed(3)}s` : 'N/A';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-sm my-4">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {submissions.length === 0 ? (
        <div className="text-center py-16 text-base-content/60">
          No submissions found for this problem yet. Run your code to see history!
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table table-zebra w-full bg-base-200">
              <thead className="bg-base-300 text-base-content">
                <tr>
                  <th>Status</th>
                  <th>Language</th>
                  <th>Runtime</th>
                  <th>Memory</th>
                  <th>Passed</th>
                  <th>Time</th>
                  <th>Code</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub._id} className="hover">
                    <td>
                      <span className={`badge badge-sm font-medium ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="font-mono text-sm capitalize">{sub.language}</td>
<td className="font-mono text-sm">{formatRuntime(sub.runtime)}</td>
                    <td className="font-mono text-sm">{formatMemory(sub.memory)}</td>
                    {/* Fixed the variable name to match your backend model (totalTestCases) */}
                    <td className="font-mono text-sm">{sub.testCasesPassed || 0}/{sub.totalTestCases || 0}</td>
                    <td className="text-sm opacity-70">{formatDate(sub.createdAt)}</td>
                    <td>
                      <button 
                        className="btn btn-ghost btn-xs text-primary"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Code View Modal (DaisyUI Standard) */}
      {selectedSubmission && (
        <dialog className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl bg-base-100">
            <h3 className="font-bold text-lg mb-4 capitalize">
              Submission Details: {selectedSubmission.language}
            </h3>
            
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`badge ${getStatusColor(selectedSubmission.status)}`}>
                  {selectedSubmission.status}
                </span>
                <span className="badge badge-outline">
  Runtime: {formatRuntime(selectedSubmission.runtime)}
</span>
                <span className="badge badge-outline">
                  Memory: {formatMemory(selectedSubmission.memory)}
                </span>
                <span className="badge badge-outline">
                  Passed: {selectedSubmission.testCasesPassed || 0}/{selectedSubmission.totalTestCases || 0}
                </span>
              </div>
              
              {selectedSubmission.errorMessage && (
                <div className="alert alert-error shadow-sm mb-4">
                  <span className="font-mono text-sm whitespace-pre-wrap">{selectedSubmission.errorMessage}</span>
                </div>
              )}
            </div>
            
            <div className="bg-[#1e1e1e] rounded-lg border border-gray-700 overflow-hidden">
              <div className="bg-[#2d2d2d] px-4 py-2 text-xs font-mono text-gray-400 border-b border-gray-700">
                Source Code
              </div>
              <pre className="p-4 text-gray-300 overflow-x-auto text-sm font-mono leading-relaxed">
                <code>{selectedSubmission.code}</code>
              </pre>
            </div>
            
            <div className="modal-action">
              <button 
                className="btn btn-primary"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </button>
            </div>
          </div>
          {/* Clicking outside the modal closes it */}
          <form method="dialog" className="modal-backdrop" onClick={() => setSelectedSubmission(null)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default SubmissionHistory;