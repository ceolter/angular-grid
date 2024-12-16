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
}

abstract class BaseSchema implements Schema {
    protected _required = false;
    protected msg: string | null = null;

    required(): this {
        this._required = true;
        return this;
    }

    isOptional(): boolean {
        return !this._required;
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

    constructor(private fields: Record<string, Schema>) {
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
            errors.push(this.msg ?? `Expected ${x} to be an object.`);
            return { errors };
        }

        for (const [k, v] of Object.entries(x)) {
            if (k in this.fields) {
                const path = (opts?.path ?? []).concat(k);
                const result = this.fields[k].validate(v, { path });
                errors.push(...(result.errors ?? []));
                delete this.fields[k];
            } else if (this._only) {
                errors.push(`Unexpected field "${k}" in ${opts?.path?.[0] ?? 'this'} object.`);
            }
        }

        const remaining = Object.entries(this.fields);

        if (remaining.length > 0) {
            for (const [k, v] of remaining) {
                if (!v.isOptional()) {
                    errors.push(`Missing field "${k}" from ${opts?.path?.[0] ?? 'this'} object.`);
                }
            }
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
    private _deep = false;

    constructor(private options: Schema[]) {
        super();
    }

    label() {
        return 'one of: ';
    }

    deep(): OneOfSchema {
        this._deep = true;
        return this;
    }

    override validate(x: unknown, _opts?: ValidationOptions): ValidationResult {
        const errors: string[] = [];
        const labels: string[] = [];
        let atLeastOneSuccessful = false;
        let headline = `${formatPath(_opts)}Expected ${this.label()}`;

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

            return { errors: this.msg ? [this.msg] : [headline].concat(this._deep ? errors : []) };
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

export const object = (o: Record<string, Schema>): ObjectSchema => new ObjectSchema(o);

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
