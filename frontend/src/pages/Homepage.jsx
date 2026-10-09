import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router";
import { logoutUser } from "../authSlice";
import { fetchAllProblems } from "../problemSlice"; // 1. Import the new Thunk
import axiosClient from "../utils/axiosClient";

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // 2. Pull global problems state from Redux instead of local useState
  const { problemsList, isLoading, hasFetchedOnce } = useSelector((state) => state.problems);

  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: "all",
    tag: "all",
    status: "all",
  });

  // 3. Fetch global problems via Redux ONLY if we haven't fetched them yet
  useEffect(() => {
    if (!hasFetchedOnce) {
      dispatch(fetchAllProblems());
    }
  }, [dispatch, hasFetchedOnce]);

  // 4. Fetch the user's specific solved problems locally when they log in
  useEffect(() => {
    const fetchSolvedData = async () => {
      if (user) {
        try {
          const solvedRes = await axiosClient.get("/problem/problemSolvedByUser");
          const userWithSolved = solvedRes?.data;

          if (userWithSolved && Array.isArray(userWithSolved?.problemSolved)) {
            setSolvedProblems(userWithSolved?.problemSolved);
          }
        } catch (error) {
          console.error("Error fetching solved data:", error);
        }
      }
    };

    fetchSolvedData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isProblemSolved = (problemId) => {
    return solvedProblems.some((solvedObj) => solvedObj?._id === problemId);
  };

  // 5. Point the filtering logic to problemsList from Redux
  const safeProblems = Array.isArray(problemsList) ? problemsList : [];

  const filteredProblems = safeProblems.filter((problem) => {
    if (filters?.difficulty !== "all" && problem?.difficulty !== filters?.difficulty) return false;
    if (filters?.tag !== "all" && problem?.tags !== filters?.tag) return false;

    const solved = isProblemSolved(problem?._id);
    if (filters?.status === "solved" && !solved) return false;
    if (filters?.status === "unsolved" && solved) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      
      {/* DaisyUI Navbar */}
      <nav className="navbar bg-base-200 border-b border-base-300 px-6 h-16">
        <div className="flex-1">
          <Link to="/" className="text-xl font-bold tracking-wide hover:opacity-80 transition-opacity">
            CodeArena
          </Link>
        </div>

        <div className="flex-none flex items-center gap-4">
          {user?.role === "admin" && (
            <Link to="/admin" className="btn btn-info btn-outline btn-sm">
              Admin Panel
            </Link>
          )}

          {/* DaisyUI Dropdown */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm font-medium">
              {user?.firstName}
              <span className="text-xs ml-1">▼</span>
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-300 rounded-box w-40 mt-2 border border-base-100">
              <li>
                <button onClick={handleLogout} className="text-error hover:bg-error/10">
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Filters Section (DaisyUI Selects) */}
        <div className="flex flex-wrap gap-4 mb-8">
          <select
            value={filters?.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="select select-bordered select-sm w-full max-w-xs bg-base-200"
          >
            <option value="all">All Problems</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>

          <select
            value={filters?.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="select select-bordered select-sm w-full max-w-xs bg-base-200"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={filters?.tag}
            onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
            className="select select-bordered select-sm w-full max-w-xs bg-base-200"
          >
            <option value="all">All Tags</option>
            <option value="array">Array</option>
            <option value="linkedList">Linked List</option>
            <option value="graph">Graph</option>
            <option value="dp">DP</option>
          </select>
        </div>

        {/* Problem List */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : filteredProblems?.length > 0 ? (
            filteredProblems.map((problem) => (
              <Link to={`/problem/${problem?._id}`} key={problem?._id} className="block group">
                <div className="card bg-base-200 group-hover:bg-base-300 transition-colors border border-base-300 shadow-sm p-5 flex flex-row justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg">
                        {problem?.title}
                      </h3>
                      {isProblemSolved(problem?._id) && (
                        <span className="text-success text-sm font-bold">✔</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-1">
                      <span
                        className={`badge badge-outline badge-sm font-medium ${
                          problem?.difficulty === "easy"
                            ? "badge-success"
                            : problem?.difficulty === "medium"
                            ? "badge-warning"
                            : "badge-error"
                        }`}
                      >
                        {problem?.difficulty}
                      </span>

                      <span className="badge badge-info badge-outline badge-sm font-medium">
                        {problem?.tags}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center text-base-content/60 py-10">
              No problems found matching these filters.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Homepage;