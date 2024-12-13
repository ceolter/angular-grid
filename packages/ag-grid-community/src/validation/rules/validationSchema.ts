interface ValidationResult {
    errors: string[];
}

interface Schema {
    isOptional(): boolean;
    label(): string;
    message(s: string): Schema;
    validate(x: unknown, opts?: ValidationOptions): ValidationResult;
}

interface ValidationOptions {
    path?: string[];
    parent?: object;
}

abstract class BaseSchema implements Schema {
    protected opt = false;
    protected msg: string | null = null;

    optional(): this {
        this.opt = true;
        return this;
    }

    isOptional(): boolean {
        return this.opt;
    }

    message(s: string): this {
        this.msg = s;
        return this;
    }

    abstract label(): string;
    abstract validate(x: unknown, opts?: ValidationOptions): ValidationResult;
}

class ObjectSchema extends BaseSchema implements Schema {
    private _only = false;

    constructor(
        private fields: Record<string, Schema>,
        private name?: string
    ) {
        super();
    }

    label(): string {
        return 'an object value';
    }

    only(): ObjectSchema {
        this._only = true;
        return this;
    }

    override validate(x: unknown, opts?: ValidationOptions): ValidationResult {
        const errors: string[] = [];

        if (!x || typeof x !== 'object') {
            errors.push(`Expected ${x} to be an object.`);
            return { errors };
        }

        const { name } = this;
        const voptions = {
            path: this.name ? (opts?.path ?? []).concat(this.name) : undefined,
            parent: x,
        };

        for (const [k, v] of Object.entries(x)) {
            if (k in this.fields) {
                const path = voptions.path?.concat(k);
                const result = this.fields[k].validate(v, { path, parent });
                errors.push(...(result.errors ?? []));
                delete this.fields[k];
            } else if (this._only) {
                errors.push(`Unexpected field ${k} in ${name} object.`);
            }
        }

        const remaining = Object.entries(this.fields);

        if (remaining.length > 0) {
            for (const [k, v] of remaining) {
                if (!v.isOptional()) {
                    errors.push(`Missing field ${k} from ${name} object.`);
                }
            }
        }

        return { errors: errors.length > 0 && this.msg ? [this.msg] : errors };
    }
}

class StringSchema extends BaseSchema implements Schema {
    private min = 0;
    private max = Number.MAX_SAFE_INTEGER;
    private patt: RegExp | null = null;

    label() {
        return 'a string value';
    }

    minLength(n: number): StringSchema {
        this.min = n;
        return this;
    }

    maxLength(n: number): StringSchema {
        this.max = n;
        return this;
    }

    pattern(r: RegExp): StringSchema {
        this.patt = r;
        return this;
    }

    override validate(x: unknown, _opts?: ValidationOptions): ValidationResult {
        const errors: string[] = [];

        if (typeof x !== 'string') {
            errors.push(`Expected ${x} to be a string.`);
            return { errors };
        }
        const len = x.length;
        const { min, max, patt } = this;

        if (len < min) {
            errors.push(`String ${x} must have length at least ${min}.`);
        }
        if (len > max) {
            errors.push(`String ${x} must have length at least ${max}.`);
        }
        if (patt && !patt.test(x)) {
            errors.push(`String ${x} does not satisfy expected pattern.`);
        }

        return { errors: errors.length > 0 && this.msg ? [this.msg] : errors };
    }
}

class LiteralSchema extends BaseSchema implements Schema {
    constructor(private literal: unknown) {
        super();
    }

    label() {
        return typeof this.literal === 'string' ? `"${this.literal}"` : '' + this.literal;
    }

    override validate(x: unknown, _opts?: ValidationOptions): ValidationResult {
        const errors: string[] = [];

        if (x !== this.literal) {
            errors.push(formatPath(_opts) + (this.msg ?? `Expected ${x} to equal ${this.literal}.`));
        }

        return { errors };
    }
}

class OneOfSchema extends BaseSchema implements Schema {
    private _shallow = false;

    constructor(private options: Schema[]) {
        super();
    }

    label() {
        return 'one of: ';
    }

    shallow(): OneOfSchema {
        this._shallow = true;
        return this;
    }

    override validate(x: unknown, _opts?: ValidationOptions): ValidationResult {
        const errors: string[] = [];
        const labels: string[] = [];
        let atLeastOneSuccessful = false;
        let headline = `${formatPath(_opts)}Expected ${x} to be ${this.label()}`;

        for (const option of this.options) {
            const result = option.validate(x);

            if (result.errors.length > 0) {
                labels.push(option.label());
                errors.push(...result.errors);
            } else {
                atLeastOneSuccessful = true;
            }
        }

        if (!atLeastOneSuccessful && errors.length > 0) {
            headline += labels.join(', ') + '.';

            return { errors: this.msg ? [this.msg] : [headline].concat(this._shallow ? [] : errors) };
        }

        return { errors: [] };
    }
}

class FunctionSchema extends BaseSchema implements Schema {
    override label(): string {
        return 'a function';
    }

    override validate(x: unknown, _opts?: ValidationOptions): ValidationResult {
        const errors: string[] = [];

        if (typeof x !== 'function') {
            errors.push(formatPath(_opts) + (this.msg ?? `Expected ${x} to be a function.`));
        }

        return { errors };
    }
}

class BooleanSchema extends BaseSchema implements Schema {
    override label(): string {
        return 'a boolean';
    }

    override validate(x: unknown, _opts?: ValidationOptions): ValidationResult {
        const errors: string[] = [];

        if (typeof x !== 'boolean') {
            errors.push(formatPath(_opts) + (this.msg ?? `Expected ${x} to be a boolean.`));
        }

        return { errors };
    }
}

class ConditionalSchema extends BaseSchema implements Schema {
    private consequent: Schema;
    private alternative: Schema | null;

    constructor(private predicate: (o?: ValidationOptions) => boolean) {
        super();
    }

    override label(): string {
        return '';
    }

    then(x: Schema): ConditionalSchema {
        this.consequent = x;
        return this;
    }

    else(x: Schema): ConditionalSchema {
        this.alternative = x;
        return this;
    }

    override validate(x: unknown, opts?: ValidationOptions): ValidationResult {
        const errors: string[] = [];

        const { predicate, consequent, alternative } = this;

        if (predicate(opts)) {
            const result = consequent.validate(x, opts);
            const messages = result.errors.length > 0 && this.msg ? [this.msg] : result.errors;
            errors.push(...messages);
        } else {
            errors.push(...(alternative?.validate(x, opts).errors ?? []));
        }

        return { errors };
    }
}

class UndefinedSchema extends BaseSchema implements Schema {
    override label(): string {
        return 'undefined';
    }

    override validate(x: unknown, opts?: ValidationOptions | undefined): ValidationResult {
        const errors: string[] = [];

        if (typeof x !== 'undefined') {
            errors.push(formatPath(opts) + `Expected ${x} to be undefined`);
        }

        return { errors };
    }
}

export const object = (o: Record<string, Schema>, name?: string): ObjectSchema => new ObjectSchema(o, name);

export const string = (): StringSchema => new StringSchema();

export const literal = (x: unknown): LiteralSchema => new LiteralSchema(x);

export const oneOf = (xs: Schema[]): OneOfSchema => new OneOfSchema(xs);

export const func = (): FunctionSchema => new FunctionSchema();

export const boolean = (): BooleanSchema => new BooleanSchema();

export const _if = (predicate: (o?: ValidationOptions) => boolean): ConditionalSchema =>
    new ConditionalSchema(predicate);

export const _undefined = (): UndefinedSchema => new UndefinedSchema();

export const formatResult = ({ errors = [] }: ValidationResult): null | string => {
    if (errors.length === 0) {
        return null;
    }

    return ['Validation error:\n'].concat(errors).join('\n');
};

export const formatPath = ({ path = [] }: ValidationOptions = {}) => {
    const str = path.join('.');
    return str.length > 0 ? str + ': ' : str;
};
