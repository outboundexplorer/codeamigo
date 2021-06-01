import { useSandpack } from '@codesandbox/sandpack-react';
import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

import Icon from '👨‍💻components/Icon';
import {
  CodeSandboxTestMsgType,
  TestDataType,
} from '👨‍💻widgets/Lesson/Console/Tests/types';

const Tests: React.FC<Props> = () => {
  const { dispatch } = useSandpack();
  const [suites, setSuites] = useState<TestDataType[]>();
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    const handleTestResults = (msg: MessageEvent<CodeSandboxTestMsgType>) => {
      if (msg.data.type !== 'test') return;

      switch (msg.data.event) {
        case 'test_end':
          setSuites((curr) => [...(curr || []), msg.data.test]);
          break;
        case 'total_test_end':
          setIsRunning(false);
          break;
        case 'total_test_start':
          setIsRunning(true);
          setSuites([]);
          break;
      }
    };

    window.addEventListener('message', handleTestResults);

    return () => window.removeEventListener('message', handleTestResults);
  }, []);

  const runTests = () => {
    if (isRunning) return;
    // @ts-ignore
    dispatch({ type: 'run-all-tests' });
  };

  return (
    <div>
      <div className="text-text-primary" onClick={() => runTests()}>
        <div className="flex justify-between items-center border-b-2">
          <div className="px-4 py-3 text-xl font-semibold sticky top-0">
            Test Summary
          </div>
          <div
            className="flex px-4 py-3 text-md font-medium cursor-pointer items-center"
            onClick={() => runTests()}
            role="button"
          >
            <Icon
              className="mr-2 text-lg"
              name={isRunning ? 'pause' : 'play'}
            />
            {isRunning ? 'Running' : 'Run Tests'}
          </div>
        </div>
      </div>
      <div className="p-4">
        {suites?.map((suite, i) => (
          <div className="mb-4" key={i}>
            <div
              className={`text-md font-bold ${
                suite.status === 'fail' ? 'text-red-400' : 'text-green-500'
              }`}
            >
              {suite.status === 'pass' ? <>✅</> : null}{' '}
              {suite.blocks.join(' > ')} {'> ' + suite.name}
            </div>
            {suite.errors.map((val) =>
              val.message.split('//').map((value, i) => {
                return (
                  <div className="text-text-primary text-md mb-1" key={i}>
                    {value}
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

type Props = {};

export default Tests;