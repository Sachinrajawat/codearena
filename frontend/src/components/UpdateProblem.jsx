import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router';
import { useDispatch } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { updateProblemLocally } from '../problemSlice';

const LANGUAGES = ['c++', 'java', 'javascript'];

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z
    .array(
      z.object({
        input: z.string().min(1, 'Input is required'),
        output: z.string().min(1, 'Output is required'),
        explaination: z.string().min(1, 'Explanation is required'),
      }),
    )
    .min(1, 'At least one visible test case is required'),
  hiddenTestCases: z
    .array(
      z.object({
        input: z.string().min(1, 'Input is required'),
        output: z.string().min(1, 'Output is required'),
      }),
    )
    .min(1, 'At least one hidden test case is required'),
  startCode: z.array(
    z.object({
      language: z.string(),
      initialCode: z.string().min(1, 'Initial code is required'),
    }),
  ),
  referenceSolution: z.array(
    z.object({
      language: z.string(),
      completeCode: z.string().min(1, 'Reference solution is required'),
    }),
  ),
});

// Stored arrays can be in any order; the form always uses c++, java, javascript
const byLanguage = (list, key) =>
  LANGUAGES.map((language) => ({
    language,
    [key]: list?.find((item) => item.language === language)?.[key] ?? '',
  }));

const toFormValues = (problem) => ({
  title: problem.title,
  description: problem.description,
  difficulty: problem.difficulty,
  tags: problem.tags,
  visibleTestCases: problem.visibleTestCases.map(({ input, output, explaination }) => ({
    input,
    output,
    explaination,
  })),
  hiddenTestCases: problem.hiddenTestCases.map(({ input, output }) => ({ input, output })),
  startCode: byLanguage(problem.startCode, 'initialCode'),
  referenceSolution: byLanguage(problem.referenceSolution, 'completeCode'),
});

const UpdateProblem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [apiError, setApiError] = useState('');
  const [apiDetails, setApiDetails] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(problemSchema) });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible,
  } = useFieldArray({ control, name: 'visibleTestCases' });
  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden,
  } = useFieldArray({ control, name: 'hiddenTestCases' });
  const { fields: langFields } = useFieldArray({ control, name: 'startCode' });

  useEffect(() => {
    let cancelled = false;

    const loadProblem = async () => {
      try {
        const response = await axiosClient.get(`/problem/admin/problemByID/${id}`);
        if (cancelled) return;
        reset(toFormValues(response.data));
      } catch (err) {
        if (cancelled) return;
        console.error('Load problem failed:', err.response?.data || err);
        setLoadError(
          err.response?.data?.message ||
            (err.response
              ? 'Failed to load the problem.'
              : 'Unable to reach the server. Please try again.'),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProblem();
    return () => {
      cancelled = true;
    };
  }, [id, reset]);

  const onSubmit = async (data) => {
    setApiError('');
    setApiDetails('');
    setApiSuccess('');
    try {
      // The backend re-verifies every reference solution on Judge0 before saving
      const response = await axiosClient.put(`/problem/update/${id}`, data);
      const updated = response.data;

      dispatch(
        updateProblemLocally({
          _id: updated._id,
          title: updated.title,
          difficulty: updated.difficulty,
          tags: updated.tags,
        }),
      );

      setApiSuccess('Problem updated successfully!');
      setTimeout(() => navigate('/admin/update'), 1500);
    } catch (err) {
      console.error('Update problem failed:', err.response?.data || err);
      const body = err.response?.data;
      setApiError(
        body?.message ||
          (err.response
            ? 'Failed to update problem.'
            : 'Unable to reach the server. Please try again.'),
      );
      setApiDetails(body?.details || '');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="alert alert-error max-w-md">
          <span>{loadError}</span>
        </div>
        <Link to="/admin/update" className="btn btn-primary btn-sm">
          Back to list
        </Link>
      </div>
    );
  }

  const fieldError = (message) =>
    message ? <p className="text-error text-xs mt-1">{message}</p> : null;

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link to="/admin/update" className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Update Problem</h1>
            <p className="text-sm opacity-70 mt-1">
              Saving re-runs every reference solution against the visible test cases.
            </p>
          </div>
        </div>

        {apiError && (
          <div role="alert" className="alert alert-error items-start">
            <div>
              <span>{apiError}</span>
              {apiDetails && (
                <pre className="mt-2 text-xs whitespace-pre-wrap font-mono">{apiDetails}</pre>
              )}
            </div>
          </div>
        )}
        {apiSuccess && (
          <div role="alert" className="alert alert-success">
            <span>{apiSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="card bg-base-200 border border-base-300 p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold border-b border-base-300 pb-3">
              Basic Information
            </h2>

            <div>
              <label className="label">
                <span className="label-text font-medium">Title</span>
              </label>
              <input
                {...register('title')}
                className={`input input-bordered w-full bg-base-100 ${errors.title ? 'input-error' : ''}`}
              />
              {fieldError(errors.title?.message)}
            </div>

            <div>
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              <textarea
                {...register('description')}
                rows="4"
                className={`textarea textarea-bordered w-full bg-base-100 ${errors.description ? 'textarea-error' : ''}`}
              />
              {fieldError(errors.description?.message)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Difficulty</span>
                </label>
                <select
                  {...register('difficulty')}
                  className="select select-bordered w-full bg-base-100"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-medium">Tags</span>
                </label>
                <select
                  {...register('tags')}
                  className="select select-bordered w-full bg-base-100"
                >
                  <option value="array">Array</option>
                  <option value="linkedList">Linked List</option>
                  <option value="graph">Graph</option>
                  <option value="dp">DP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div className="card bg-base-200 border border-base-300 p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold border-b border-base-300 pb-3">Test Cases</h2>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Visible Test Cases</h3>
                <button
                  type="button"
                  onClick={() => appendVisible({ input: '', output: '', explaination: '' })}
                  className="btn btn-primary btn-sm"
                >
                  + Add Visible Case
                </button>
              </div>
              {fieldError(errors.visibleTestCases?.message || errors.visibleTestCases?.root?.message)}

              {visibleFields.map((field, index) => (
                <div
                  key={field.id}
                  className="card bg-base-100 border border-base-300 p-4 mb-4 relative shadow-sm"
                >
                  {visibleFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVisible(index)}
                      className="btn btn-ghost btn-xs text-error absolute top-3 right-3"
                    >
                      Remove
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="label">
                        <span className="label-text-alt">Input</span>
                      </label>
                      <textarea
                        {...register(`visibleTestCases.${index}.input`)}
                        className="textarea textarea-bordered w-full bg-base-200 font-mono text-sm"
                      />
                      {fieldError(errors.visibleTestCases?.[index]?.input?.message)}
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text-alt">Output</span>
                      </label>
                      <textarea
                        {...register(`visibleTestCases.${index}.output`)}
                        className="textarea textarea-bordered w-full bg-base-200 font-mono text-sm"
                      />
                      {fieldError(errors.visibleTestCases?.[index]?.output?.message)}
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text-alt">Explanation</span>
                    </label>
                    <textarea
                      {...register(`visibleTestCases.${index}.explaination`)}
                      className="textarea textarea-bordered w-full bg-base-200 text-sm"
                    />
                    {fieldError(errors.visibleTestCases?.[index]?.explaination?.message)}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Hidden Test Cases</h3>
                <button
                  type="button"
                  onClick={() => appendHidden({ input: '', output: '' })}
                  className="btn btn-primary btn-sm"
                >
                  + Add Hidden Case
                </button>
              </div>
              {fieldError(errors.hiddenTestCases?.message || errors.hiddenTestCases?.root?.message)}

              {hiddenFields.map((field, index) => (
                <div
                  key={field.id}
                  className="card bg-base-100 border border-base-300 p-4 mb-4 relative shadow-sm"
                >
                  {hiddenFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHidden(index)}
                      className="btn btn-ghost btn-xs text-error absolute top-3 right-3"
                    >
                      Remove
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text-alt">Input</span>
                      </label>
                      <textarea
                        {...register(`hiddenTestCases.${index}.input`)}
                        className="textarea textarea-bordered w-full bg-base-200 font-mono text-sm"
                      />
                      {fieldError(errors.hiddenTestCases?.[index]?.input?.message)}
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text-alt">Output</span>
                      </label>
                      <textarea
                        {...register(`hiddenTestCases.${index}.output`)}
                        className="textarea textarea-bordered w-full bg-base-200 font-mono text-sm"
                      />
                      {fieldError(errors.hiddenTestCases?.[index]?.output?.message)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code Templates */}
          <div className="card bg-base-200 border border-base-300 p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold border-b border-base-300 pb-3">Code Templates</h2>

            {langFields.map((field, index) => (
              <div key={field.id} className="space-y-3">
                <span className="badge badge-neutral uppercase font-mono font-bold text-xs">
                  {field.language}
                </span>
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Initial Code</span>
                  </label>
                  <textarea
                    {...register(`startCode.${index}.initialCode`)}
                    className="textarea textarea-bordered w-full h-32 bg-base-100 font-mono text-sm"
                  />
                  {fieldError(errors.startCode?.[index]?.initialCode?.message)}
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Reference Solution</span>
                  </label>
                  <textarea
                    {...register(`referenceSolution.${index}.completeCode`)}
                    className="textarea textarea-bordered w-full h-32 bg-base-100 font-mono text-sm"
                  />
                  {fieldError(errors.referenceSolution?.[index]?.completeCode?.message)}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!apiSuccess}
            className="btn btn-primary btn-block text-base"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Verifying and saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProblem;