var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Mesa } from '@veupathdb/wdk-client/lib/Components';
import { isLeft } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import * as Path from 'path';
import * as React from 'react';
import { useHistory } from 'react-router';
import { NewSession, useStudyRecord } from '../core';
export function SessionList(props) {
    const { sessionStore } = props;
    const studyRecord = useStudyRecord();
    const studyId = studyRecord.id.map((part) => part.value).join('/');
    const [sessionList, setSessionList] = React.useState();
    const history = useHistory();
    const [selected, setSelected] = React.useState(new Set());
    const updateSessionList = React.useCallback(() => __awaiter(this, void 0, void 0, function* () {
        const list = yield sessionStore.getSessions();
        setSessionList(list.filter((a) => a.studyId === studyId));
    }), [sessionStore, studyId]);
    React.useEffect(() => {
        updateSessionList();
    }, [updateSessionList]);
    const createNewSession = React.useCallback(() => __awaiter(this, void 0, void 0, function* () {
        const { id } = yield sessionStore.createSession({
            name: 'Unnamed Session',
            studyId,
            filters: [],
            starredVariables: [],
            derivedVariables: [],
            visualizations: [],
            variableUISettings: {},
        });
        const newLocation = Object.assign(Object.assign({}, history.location), { pathname: history.location.pathname +
                (history.location.pathname.endsWith('/') ? '' : '/') +
                id });
        history.push(newLocation);
    }), [sessionStore, history, studyId]);
    const deleteSessions = React.useCallback((sessionIds) => {
        for (const sessionId of sessionIds)
            sessionStore.deleteSession(sessionId);
        updateSessionList();
    }, [sessionStore, updateSessionList]);
    const loadSession = React.useCallback((event) => {
        const file = event.currentTarget.files && event.currentTarget.files[0];
        if (file == null)
            return;
        const reader = new FileReader();
        reader.readAsText(file, 'utf-8');
        reader.onload = (loadEvent) => {
            var _a;
            try {
                const result = (_a = loadEvent.target) === null || _a === void 0 ? void 0 : _a.result;
                if (typeof result !== 'string')
                    return null;
                const json = JSON.parse(result);
                const decodeResult = NewSession.decode(json);
                if (isLeft(decodeResult)) {
                    console.error('Error parsing file\n', PathReporter.report(decodeResult));
                    alert('Error parsing file. See developer tools console for details.');
                    return;
                }
                sessionStore.createSession(decodeResult.right).then((id) => {
                    const newLocation = Object.assign(Object.assign({}, history.location), { pathname: history.location.pathname +
                            (history.location.pathname.endsWith('/') ? '' : '/') +
                            id });
                    history.push(newLocation);
                });
            }
            catch (error) {
                console.error('Error loading file: ' + error);
                alert('Error loading file. See developer tools console for details.');
            }
        };
    }, [sessionStore, history]);
    const tableState = React.useMemo(() => ({
        options: {
            isRowSelected: (session) => selected.has(session.id),
        },
        eventHandlers: {
            onRowSelect: (session) => setSelected((set) => {
                const newSet = new Set(set);
                newSet.add(session.id);
                return newSet;
            }),
            onRowDeselect: (session) => setSelected((set) => {
                const newSet = new Set(set);
                newSet.delete(session.id);
                return newSet;
            }),
            onMultipleRowSelect: (sessions) => setSelected((set) => {
                const newSet = new Set(set);
                for (const session of sessions)
                    newSet.add(session.id);
                return newSet;
            }),
            onMultipleRowDeselect: (sessions) => setSelected((set) => {
                const newSet = new Set(set);
                for (const session of sessions)
                    newSet.delete(session.id);
                return newSet;
            }),
        },
        actions: [
            {
                selectionRequired: true,
                element: (_jsx("button", Object.assign({ type: "button", className: "btn", onClick: () => deleteSessions(selected) }, { children: "Delete selected sessions" }), void 0)),
            },
            {
                selectionRequired: false,
                element: (_jsx("button", Object.assign({ type: "button", className: "btn", onClick: createNewSession }, { children: "Start a new session" }), void 0)),
            },
            {
                selectionRequired: false,
                element: (_jsxs(_Fragment, { children: [_jsx("input", { hidden: true, id: "upload-file", type: "file", className: "btn", multiple: false, onChange: loadSession }, void 0),
                        _jsx("label", Object.assign({ className: "btn", htmlFor: "upload-file" }, { children: "Upload a session from JSON" }), void 0)] }, void 0)),
            },
        ],
        rows: sessionList,
        columns: [
            {
                key: 'name',
                name: 'Name',
                renderCell: (data) => (_jsx(Link, Object.assign({ to: Path.join(history.location.pathname, data.row.id) }, { children: data.row.name }), void 0)),
            },
            { key: 'created', name: 'Created' },
            { key: 'modified', name: 'Modified' },
            {
                key: 'download',
                name: 'Download JSON',
                renderCell: (data) => (_jsx("a", Object.assign({ href: `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(data.row, null, 2))}`, download: `${data.row.name}.json` }, { children: "Download JSON" }), void 0)),
            },
        ],
    }), [
        sessionList,
        createNewSession,
        deleteSessions,
        loadSession,
        selected,
        history.location.pathname,
    ]);
    if (sessionList == null)
        return null;
    return _jsx(Mesa.Mesa, { state: tableState }, void 0);
}
//# sourceMappingURL=SessionList.js.map