import { Params } from './Params';
import type { CoreParams } from './core/core-css';
import type { Feature } from './theme-types';
import type { CssFragment } from './theme-types';

export type Part<TParams = unknown> = {
    readonly id: string;
    readonly feature: string;
    readonly variant: string;

    /**
     * Return a new Part new different default values for core grid params.
     */
    withParams(defaults: Partial<TParams>, mode?: string): Part<TParams>;

    /**
     * Return a new part with additional params. Unlike `withParams`, this can
     * be used to add support for params used by the part's own CSS.
     */
    withAdditionalParams<TAdditionalParams>(defaults: TAdditionalParams): Part<TParams & TAdditionalParams>;

    /**
     * Return a new Part with additional CSS.
     */
    withCSS(css: CssFragment): Part<TParams>;
};

export const createPartVariant = <T>(part: Part<T>, variant: string): Part<T> => {
    const partImpl = asPartImpl(part);
    return new PartImpl(partImpl.feature, variant, partImpl.params, partImpl.css);
};

export const asPartImpl = (part: Part): PartImpl => {
    if (part instanceof PartImpl) {
        return part;
    }
    throw new Error(
        'expected part to be an object created by createPart' +
            (part && typeof part === 'object' ? '' : `, got ${part}`)
    );
};

// string & {} used to preserve auto-complete from string union but allow any string
// eslint-disable-next-line @typescript-eslint/ban-types
type AnyString = string & {};

let customPartCounter = 0;
/**
 * Create a new empty part.
 *
 * @param feature an The part feature, e.g. 'iconSet'. Adding a part to a theme will remove any existing part with the same feature.
 * @param variant an optional identifier for debugging, if omitted one will be generated
 */
export const createPart = (
    feature: Feature | AnyString,
    variant: string = `customPart${++customPartCounter}`
): Part<CoreParams> => /*#__PURE__*/ new PartImpl(feature, variant);

export class PartImpl<TParams = unknown> implements Part<TParams> {
    constructor(
        readonly feature: string,
        readonly variant: string,
        readonly params: Params = new Params(),
        readonly css: ReadonlyArray<CssFragment> = []
    ) {}

    get id(): string {
        return this.feature ? `${this.feature}/${this.variant}` : this.variant;
    }

    withParams(params: Partial<TParams>, mode?: string): Part<TParams> {
        return new PartImpl(this.feature, this.variant, this.params.withParams(params, mode), this.css);
    }

    withAdditionalParams<TAdditionalParams>(defaults: TAdditionalParams): Part<TParams & TAdditionalParams> {
        return this.withParams(defaults as any) as any;
    }

    withCSS(css: CssFragment): Part<TParams> {
        return new PartImpl(this.feature, this.variant, this.params, this.css.concat(css));
    }
}
