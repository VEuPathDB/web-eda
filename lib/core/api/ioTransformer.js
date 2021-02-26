var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isLeft } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
export function ioTransformer(decoder) {
    return function decodeOrThrow(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = decoder.decode(value);
            if (isLeft(result)) {
                const message = PathReporter.report(result).join('\n');
                throw new Error(message);
            }
            return result.right;
        });
    };
}
//# sourceMappingURL=ioTransformer.js.map