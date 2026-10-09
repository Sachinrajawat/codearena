import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { Edit, ArrowLeft } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllProblems } from '../problemSlice';

const AdminUpdate = () => {
  const dispatch = useDispatch();
  const { problemsList, isLoading, hasFetchedOnce, error: listError } = useSelector(
    (state) => state.problems,
  );

  useEffect(() => {
    if (!hasFetchedOnce) {
      dispatch(fetchAllProblems());
    }
  }, [dispatch, hasFetchedOnce]);

  if (isLoading && !hasFetchedOnce) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const safeProblems = Array.isArray(problemsList) ? problemsList : [];

  return (
    <div className="min-h-screen bg-base-200 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin" className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Update Problems</h1>
            <p className="text-base-content/70 text-sm mt-1">Pick a problem to edit</p>
          </div>
        </div>

        {listError && (
          <div className="alert alert-error shadow-sm mb-6">
            <span>{listError}</span>
          </div>
        )}

        <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
          {safeProblems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead className="bg-base-200/50">
                  <tr>
                    <th className="w-16">#</th>
                    <th>Title</th>
                    <th className="w-32">Difficulty</th>
                    <th className="w-32">Tags</th>
                    <th className="w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeProblems.map((problem, index) => (
                    <tr key={problem._id} className="hover">
                      <th>{index + 1}</th>
                      <td className="font-medium">{problem.title}</td>
                      <td>
                        <span
                          className={`badge badge-sm font-medium ${
                            problem.difficulty === 'easy'
                              ? 'badge-success'
                              : problem.difficulty === 'medium'
                                ? 'badge-warning'
                                : 'badge-error'
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info badge-outline badge-sm">
                          {problem.tags}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/admin/update/${problem._id}`}
                          className="btn btn-ghost btn-sm text-warning"
                          title="Edit Problem"
                        >
                          <Edit size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-base-content/60">
              {listError ? 'Could not load problems.' : 'No problems found in the database.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUpdate;