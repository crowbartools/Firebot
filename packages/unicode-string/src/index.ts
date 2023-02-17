import getUnicodeChars from './get-unicode-chars';

export class UnicodeString extends String {
    private chars : string[];

    constructor(text: string | String | UnicodeString) {
        super(text = text + '');
        this.chars = getUnicodeChars(UnicodeString.normalize(text));
    }

    /** @desc returns the base string's length */
    get baseLength() : number {
        return super.length;
    }

    /** @desc returns the base string */
    get baseString() : string {
        return super.valueOf();
    }

    /** @desc returns the character array comprising the string */
    get characters() : string[] {
        return [ ...(this.chars) ];
    }

    /** @desc returns the number of characters comprising the string */
    get length() : number {
        return this.chars.length;
    }

    /** @desc concatinates strings an UnicodeStrings  into a singlular new string */
    concat(...args: Array<string | String | UnicodeString>) : string {
        return this.baseString.concat(...(args.map(value => '' + value)));
    }

    /** @desc concatinates strings an UnicodeStrings  into a singlular new UnicodeString */
    concatUS(...args: Array<string | String | UnicodeString>) : UnicodeString {
        return UnicodeString.from(('' + this) + args.reduce((prev, curr) => prev + ('' + curr), ''))
    }

    /** @desc Returns a potion of the UnicodeString as a string */
    slice(start: number, end?: number) : string {
        return this.chars.slice(start, end).join('');
    }

    /** @desc Returns a potion of the UnicodeString as a UnicodeString */
    sliceUS(start: number, end?: number) : UnicodeString {
        return UnicodeString.from(this.slice(start, end));
    }

    /** @desc Returns a potion of the UnicodeString as a string */
    substring(start: number, end?: number) : string {
        start = Number(start);
        if (!Number.isFinite(start) || start < 0) {
            start = 0;
        }
        end = Number(end);
        if (!Number.isFinite(end) || end < 0) {
            end = 0;
        }
        return this.slice(start, end);
    }

    /** @desc Returns a potion of the UnicodeString as a UnicodeString */
    substringUS(start: number, end?: number) : UnicodeString {
        start = Number(start);
        if (!Number.isFinite(start) || start < 0) {
            start = 0;
        }
        end = Number(end);
        if (!Number.isFinite(end) || end < 0) {
            end = 0;
        }
        return this.sliceUS(start, end);
    }

    toString() {
        return super.valueOf();
    }

    valueOf() {
        return super.valueOf();
    }

    /** @desc Returns a UnicodeString based on the input */
    static from(subject: unknown) : UnicodeString {
        if (typeof subject === 'function') {
            throw new Error('invalid input')
        } else if (subject == null) {
            subject = '';
        } else if (typeof subject !== 'string') {
            subject = '' + subject;
        }
        return new Proxy(new UnicodeString(<string>subject), {
            get(target, property, reciever) {
                if (typeof property === 'number' || Number.isFinite(Number(property))) {
                    return target.chars[<number>(<unknown>property)];
                }
                Reflect.get(target, property, reciever);
            },
            getOwnPropertyDescriptor(target, key) : PropertyDescriptor | undefined {
                if (Number.isInteger(Number(key))) {
                    const value = Number(key);
                    return { enumerable: true, configurable: false, writable: false, value: target.chars[value] }
                }
            },
            ownKeys(target) : string[] {
                const res : string[] = [];
                for (let i = 0, len = target.length; i < len; i += 1) {
                    res.push(i + '');
                }
                return res;
            }
        });
    }

    /** @desc normalizes unicode text */
    static normalize(subject: string | String | UnicodeString) : string {
        return ('' + subject).normalize("NFC");
    }
}

export default UnicodeString.from;