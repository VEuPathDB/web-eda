var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import localforage from 'localforage';
const localStore = localforage.createInstance({
    name: 'mockSessionStore',
});
export const mockSessionStore = {
    getSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            const records = [];
            yield localStore.iterate((value) => {
                records.push(value);
            });
            return records;
        });
    },
    createSession(newSession) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = String((yield localStore.keys()).length + 1);
            const now = new Date().toISOString();
            yield localStore.setItem(id, Object.assign(Object.assign({}, newSession), { id, created: now, modified: now }));
            return { id };
        });
    },
    getSession(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield localStore.getItem(id);
            if (session)
                return session;
            throw new Error(`Could not find session with id "${id}".`);
        });
    },
    updateSession(session) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            yield localStore.setItem(session.id, Object.assign(Object.assign({}, session), { modified: now }));
        });
    },
    deleteSession(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield localStore.removeItem(id);
        });
    },
};
//# sourceMappingURL=Mocks.js.map