import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';
import { addProblemLocally } from '../problemSlice';
import { useDispatch } from 'react-redux';

// Zod schema matching the problem schema
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explaination: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case is required'),
  
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case is required'),

  startCode: z.array(
    z.object({
      language: z.string(),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ),
  
  referenceSolution: z.array(
    z.object({
      language: z.string(),
      completeCode: z.string().min(1, 'Reference solution is required')
    })
  )
});

const CreateProblem = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [apiError, setApiError] = useState('');
  const [apiDetails, setApiDetails] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Initialize React Hook Form with Zod validation
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'easy',
      tags: 'array',
      visibleTestCases: [{ input: '', output: '', explaination: '' }],
      hiddenTestCases: [{ input: '', output: '' }],
      startCode: [
        { language: 'c++', initialCode: '' },
        { language: 'java', initialCode: '' },
        { language: 'javascript', initialCode: '' }
      ],
      referenceSolution: [
        { language: 'c++', completeCode: '' },
        { language: 'java', completeCode: '' },
        { language: 'javascript', completeCode: '' }
      ]
    }
  });

  // Dynamic Array Handlers
  const { fields: visibleFields, append: appendVisible, remove: removeVisible } = useFieldArray({ control, name: 'visibleTestCases' });
  const { fields: hiddenFields, append: appendHidden, remove: removeHidden } = useFieldArray({ control, name: 'hiddenTestCases' });
  const { fields: langFields } = useFieldArray({ control, name: 'startCode' }); 

  const onSubmit = async (data) => {
    setApiError('');
    setApiDetails('');
    setApiSuccess('');
    try {
      // The backend first verifies every reference solution on Judge0, then saves
      const response = await axiosClient.post('/problem/create', data);

      // Add the new problem to the cached list so Homepage shows it immediately
      if (response.data?.problem) {
        dispatch(addProblemLocally(response.data.problem));
      }

      setApiSuccess('Problem created successfully!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Create problem failed:', err.response?.data || err);
      const body = err.response?.data;
      setApiError(
        body?.message ||
          (err.response
            ? 'Failed to create problem.'
            : 'Unable to reach the server. Please try again.'),
      );
      setApiDetails(body?.details || '');
    }
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Problem</h1>
          <p className="text-sm opacity-70 mt-1">Fill in the details to publish a new challenge to the platform.</p>
        </div>

        {apiError && (
          <div role="alert" className="alert alert-error items-start">
            <div>
              <span>{apiError}</span>
              {apiDetails && (
                <pre className="mt-2 text-xs whitespace-pre-wrap font-mono">
                  {apiDetails}
                </pre>
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
          
          {/* Basic Information Section */}
          <div className="card bg-base-200 border border-base-300 p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold border-b border-base-300 pb-3">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Title</span>
                </label>
                <input 
                  {...register('title')}
                  placeholder="Adding of 2 Integers"
                  className={`input input-bordered w-full bg-base-100 ${errors.title ? 'input-error' : ''}`}
                />
                {errors.title && <p className="text-error text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">Description</span>
                </label>
                <textarea 
                  {...register('description')}
                  placeholder="Given two integers a and b, return their sum..."
                  rows="4"
                  className={`textarea textarea-bordered w-full bg-base-100 ${errors.description ? 'textarea-error' : ''}`}
                />
                {errors.description && <p className="text-error text-xs mt-1">{errors.description.message}</p>}
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
          </div>

          {/* Test Cases Section */}
          <div className="card bg-base-200 border border-base-300 p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold border-b border-base-300 pb-3">Test Cases</h2>
            
            {/* Visible Test Cases */}
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
              
              {visibleFields.map((field, index) => (
                <div key={field.id} className="card bg-base-100 border border-base-300 p-4 mb-4 relative shadow-sm">
                  {index > 0 && (
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
                        placeholder="Input" 
                        className={`textarea textarea-bordered w-full bg-base-200 font-mono text-sm ${errors.visibleTestCases?.[index]?.input ? 'textarea-error' : ''}`} 
                      />
                      {errors.visibleTestCases?.[index]?.input && <p className="text-error text-xs mt-1">{errors.visibleTestCases[index].input.message}</p>}
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text-alt">Output</span>
                      </label>
                      <textarea 
                        {...register(`visibleTestCases.${index}.output`)} 
                        placeholder="Output" 
                        className={`textarea textarea-bordered w-full bg-base-200 font-mono text-sm ${errors.visibleTestCases?.[index]?.output ? 'textarea-error' : ''}`} 
                      />
                      {errors.visibleTestCases?.[index]?.output && <p className="text-error text-xs mt-1">{errors.visibleTestCases[index].output.message}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <label className="label">
                      <span className="label-text-alt">Explanation</span>
                    </label>
                    <textarea 
                      {...register(`visibleTestCases.${index}.explaination`)} 
                      placeholder="Explanation" 
                      className={`textarea textarea-bordered w-full bg-base-200 text-sm ${errors.visibleTestCases?.[index]?.explaination ? 'textarea-error' : ''}`} 
                    />
                    {errors.visibleTestCases?.[index]?.explaination && <p className="text-error text-xs mt-1">{errors.visibleTestCases[index].explaination.message}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Hidden Test Cases */}
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

              {hiddenFields.map((field, index) => (
                <div key={field.id} className="card bg-base-100 border border-base-300 p-4 mb-4 relative shadow-sm">
                  {index > 0 && (
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
                        placeholder="Input" 
                        className={`textarea textarea-bordered w-full bg-base-200 font-mono text-sm ${errors.hiddenTestCases?.[index]?.input ? 'textarea-error' : ''}`} 
                      />
                      {errors.hiddenTestCases?.[index]?.input && <p className="text-error text-xs mt-1">{errors.hiddenTestCases[index].input.message}</p>}
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text-alt">Output</span>
                      </label>
                      <textarea 
                        {...register(`hiddenTestCases.${index}.output`)} 
                        placeholder="Output" 
                        className={`textarea textarea-bordered w-full bg-base-200 font-mono text-sm ${errors.hiddenTestCases?.[index]?.output ? 'textarea-error' : ''}`} 
                      />
                      {errors.hiddenTestCases?.[index]?.output && <p className="text-error text-xs mt-1">{errors.hiddenTestCases[index].output.message}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code Templates Section */}
          <div className="card bg-base-200 border border-base-300 p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold border-b border-base-300 pb-3">Code Templates</h2>
            
            {langFields.map((field, index) => {
              const lang = field.language;
              
              return (
                <div key={field.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-neutral uppercase font-mono font-bold text-xs">{lang}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">Initial Code</span>
                      </label>
                      <textarea 
                        {...register(`startCode.${index}.initialCode`)}
                        className={`textarea textarea-bordered w-full h-32 bg-base-100 font-mono text-sm ${errors.startCode?.[index]?.initialCode ? 'textarea-error' : ''}`}
                      />
                      {errors.startCode?.[index]?.initialCode && <p className="text-error text-xs mt-1">{errors.startCode[index].initialCode.message}</p>}
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">Reference Solution</span>
                      </label>
                      <textarea 
                        {...register(`referenceSolution.${index}.completeCode`)}
                        className={`textarea textarea-bordered w-full h-32 bg-base-100 font-mono text-sm ${errors.referenceSolution?.[index]?.completeCode ? 'textarea-error' : ''}`}
                      />
                      {errors.referenceSolution?.[index]?.completeCode && <p className="text-error text-xs mt-1">{errors.referenceSolution[index].completeCode.message}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button 
              type="submit" 
               disabled={isSubmitting || !!apiSuccess}
              className="btn btn-primary btn-block text-base"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating Problem...
                </>
              ) : (
                'Create Problem'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateProblem;