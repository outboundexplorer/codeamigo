import { Form, Formik } from "formik";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ControlledEditor } from "@monaco-editor/react";

import {
  useCreateLessonMutation,
  useLessonQuery,
  useUpdateLessonDescriptionMutation,
  useUpdateLessonTitleMutation,
} from "../../generated/graphql";
import withApollo from "../../utils/withApollo";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import { NextPage } from "next";

const originalMarkdown = `## Step \#

### Instructions
1. Add instructions for the step here.
2. You can use markdown to add [links](https://google.com)
3. Or use it to add \`code\` snippets.

\`\`\`
You can also write code in blocks.
\`\`\`

Remember to be short and sweet. 😘
`;

const EditLesson: NextPage<{ id: string }> = (props) => {
  const id = parseInt(props.id);
  const router = useRouter();
  const [markdown, setMarkdown] = useState(originalMarkdown);
  const [preview, setPreview] = useState(false);
  const [code, setCode] = useState<string>("");

  const { loading, error, data } = useLessonQuery({ variables: { id } });

  const [updateLessonTitle] = useUpdateLessonTitleMutation();
  const [updateLessonDescription] = useUpdateLessonDescriptionMutation();
  const inputElement = useRef(null);

  useEffect(() => {
    if (inputElement.current) {
      // @ts-ignore
      inputElement.current.focus();
    }
  }, []);

  const handleBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
    await updateLessonTitle({
      variables: { title: event.currentTarget.value, id },
    });
  };

  return (
    <Formik
      initialValues={{ title: "", description: "" }}
      onSubmit={async (values, { setErrors }) => {
        return;
      }}
    >
      {({ isSubmitting }) => (
        <Form>
          <>
            <div className="max-w-2xl px-8">
              <div className="px-4 py-5 bg-white sm:p-6">
                <div className="grid gap-2">
                  <input
                    autoFocus={true}
                    ref={inputElement}
                    name="title"
                    type="text"
                    placeholder="Lesson title"
                    onBlur={(event) => handleBlur(event)}
                    className="border-0 focus:ring-0 p-0 text-2xl"
                    defaultValue={data?.lesson?.title}
                  />
                  <input
                    name="description"
                    type="text"
                    placeholder="Add a description"
                    className="border-0 focus:ring-0 p-0 text-lg"
                    defaultValue={data?.lesson?.description}
                  />
                </div>
              </div>
            </div>
            <div className="flex w-full px-8">
              <div className="w-2/4 pl-4 bg-white sm:pl-6">
                <ul className="list-reset flex pl-2">
                  <li className="list-none relative cursor-pointer">
                    <a
                      className={`${
                        preview
                          ? "border-transparent text-gray-500"
                          : "border-gray-200 text-gray-700"
                      } bg-white inline-block text-sm py-2 px-4 font-medium border border-b-0 rounded-t hover:text-gray-700`}
                      onClick={() => setPreview(false)}
                    >
                      Edit
                    </a>
                  </li>
                  <li className="list-none relative cursor-pointer">
                    <a
                      className={`${
                        preview
                          ? "border-gray-200 text-gray-700"
                          : "border-transparent text-gray-500"
                      } bg-white inline-block text-sm py-2 px-4 font-medium border border-b-0 rounded-t hover:text-gray-700`}
                      onClick={() => setPreview(true)}
                    >
                      Preview
                    </a>
                  </li>
                </ul>
                <div className="rounded-md border border-gray-200">
                  {preview ? (
                    <ReactMarkdown
                      className="markdown-body px-6 py-4"
                      children={markdown}
                      plugins={[gfm]}
                    />
                  ) : (
                    <ControlledEditor
                      height="300px"
                      width="100%"
                      value={markdown}
                      onChange={(_, value) => setMarkdown(value || "")}
                      options={{
                        minimap: { enabled: false },
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="w-2/4 pr-4 bg-white sm:pr-6">
                <ul className="list-reset flex pl-2">
                  <li className="list-none relative cursor-pointer">
                    <a
                      className={`border-gray-200 text-gray-700 bg-white inline-block text-sm py-2 px-4 font-medium border border-b-0 rounded-t hover:text-gray-700`}
                    >
                      Initial Code
                    </a>
                  </li>
                </ul>
                <div className="rounded-md border border-gray-200">
                  <ControlledEditor
                    height="300px"
                    width="100%"
                    language="typescript"
                    options={{
                      iframe: true,
                      minimap: { enabled: false },
                    }}
                    onChange={(_, value) => setCode(value || "")}
                  />
                </div>
              </div>
            </div>
          </>
        </Form>
      )}
    </Formik>
  );
};

EditLesson.getInitialProps = ({ query }) => ({
  id: query.id as string,
});

export default EditLesson;