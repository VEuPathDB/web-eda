import { SaveableTextEditor } from '@veupathdb/wdk-client/lib/Components';
import React from 'react';
import { useHistory } from 'react-router';
import { Session } from '../core';
import { ActionIconButton } from './ActionIconButton';
import { cx } from './Utils';

interface Props {
  session: Session;
  setSessionName: (name: string) => void;
  copySession: () => Promise<{ id: string }>;
  saveSession: () => void;
  deleteSession: () => void;
}

export function SessionSummary(props: Props) {
  const {
    session,
    setSessionName,
    copySession,
    saveSession,
    deleteSession,
  } = props;
  const history = useHistory();
  const handleCopy = async () => {
    const res = await copySession();
    history.push(res.id);
  };
  return (
    <div className={cx('-SessionSummary')}>
      <SaveableTextEditor
        className={cx('-SessionNameEditBox')}
        value={session.name}
        onSave={setSessionName}
      />
      <ActionIconButton
        iconClassName="clone"
        hoverText="Copy session"
        action={handleCopy}
      />
      <ActionIconButton
        iconClassName="floppy-o"
        hoverText="Save session"
        action={saveSession}
      />
      <ActionIconButton
        iconClassName="trash"
        hoverText="Delete session"
        action={deleteSession}
      />
    </div>
  );
}
