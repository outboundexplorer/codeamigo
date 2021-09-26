import { Menu, Transition } from '@headlessui/react';
import React from 'react';

import Icon from '👨‍💻components/Icon';
import { SessionsQuery, useDeleteSessionMutation } from '👨‍💻generated/graphql';
import LessonListItem from '👨‍💻widgets/LessonListItem';

const SessionItem: React.FC<Props> = ({ session }) => {
  const [deleteSessionM] = useDeleteSessionMutation();

  const deleteSession = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number
  ) => {
    e.stopPropagation();
    const yes = window.confirm('Are you sure you want to end this class?');
    if (yes) {
      await deleteSessionM({ refetchQueries: ['Sessions'], variables: { id } });
    }
  };

  const steps = session.steps;
  const length = steps?.length || 1;
  const completed = steps?.filter(({ isCompleted }) => !!isCompleted) || [];
  const percentComplete = Math.floor((completed.length / length) * 100);

  return (
    <LessonListItem
      href={`/lessons/start/${session.lesson.id}`}
      lesson={session.lesson}
      options={
        <div className="relative z-10">
          <Menu>
            {({ open }) => (
              <>
                <Menu.Button
                  aria-haspopup="true"
                  className={`flex text-sm outline-none focus:outline-none`}
                >
                  <span className="sr-only">Open class menu</span>
                  <Icon className="text-gray-400" name="dot-3" />
                </Menu.Button>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                  show={open}
                >
                  <Menu.Items
                    aria-labelledby="user-menu"
                    aria-orientation="vertical"
                    className="origin-top-right bg-bg-primary absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5"
                    role="menu"
                  >
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`w-full inline-block text-left px-4 py-2 text-sm ${
                            active
                              ? 'bg-accent text-bg-primary'
                              : 'text-text-primary'
                          }`}
                          onClick={(e) => deleteSession(e, session.id)}
                          role="menuitem"
                        >
                          End Class
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </>
            )}
          </Menu>
        </div>
      }
      progress={
        <div className="mt-4 text-xs">
          <div
            aria-label={`Completed: ${percentComplete}%`}
            className="relative bg-gray-200 w-full h-2 rounded-md hint--top hint--no-animate"
          >
            <div
              className="absolute bg-green-500 h-full rounded-md"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      }
    />
  );
};

type Props = {
  session: SessionsQuery['sessions'][0];
};

export default SessionItem;
