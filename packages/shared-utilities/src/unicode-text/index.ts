import getUnicodeChars from './get-unicode-chars';

export class UnicodeText extends String {
    private chars : string[];

    constructor(text: string | String | UnicodeText) {
        super(text = text + '');
        this.chars = getUnicodeChars(UnicodeText.normalize(text));
    }
    get baseLength() : number {
        return super.length;
    }
    get baseString() : string {
        return super.valueOf();
    }
    get characters() : string[] {
        return [ ...(this.chars) ];
    }
    get length() : number {
        return this.chars.length;
    }

    /** Retrieves the unicode character at the specified position
     * @param position The character position to retrieve
     * @returns Unicode character at the specified position
     */
    at(position: number) : string | undefined {
        if (
            position == null ||
            !Number.isFinite(position = Number(position)) ||
            Math.abs(position) >= this.chars.length
        ) {
            return;
        }
        if (position < 0) {
            position = this.chars.length - position;
        }
        return this.chars[position];
    }

    /** Retrieves the unicode character at the specified position
     * @param position The character position to retrieve
     * @returns Unicode character at the specified position
     */
    charAt(position: number) : string {
        position = Number(position);
        if (Number.isInteger(position)) {
            position = 0;
        }
        return this.chars[position];
    }

    // charCodeAt() - ??
    // codePointAt() - ??

    /** Returns a new string with the specified arguments concatinated to the base
     * @param args strings to concat to the instance's string
     */
    concat(...args: Array<string | String | UnicodeText>) : string {
        return this.baseString.concat(...(args.map(value => '' + value)));
    }

    /** Returns a new UnicodeText with the specified arguments concatinated to the base
     * @param args strings to concat to the instance's string
     */
    concatUS(...args: Array<string | String | UnicodeText>) : UnicodeText {
        return UnicodeText.from(this.baseString.concat(...(args.map((value : unknown) => value + ''))));
    }

    /** Returns true if the searchTerm is found in the base string
     * @param searchTerm The text to search for
     * @param endPosition The ending position in the base string that the searchTerm should end at
     */
    endsWith(searchTerm: string | UnicodeText, endPosition?: number) : boolean {
        let selfChars = this.characters;
        if (endPosition == null) {
            endPosition = selfChars.length
        }
        if (
            searchTerm == null ||
            !Number.isInteger(endPosition = Number(endPosition)) ||
            endPosition > selfChars.length
        ) {
            return false
        }
        selfChars = selfChars.slice(0, endPosition);

        let searchChars : string[];
        if (searchTerm instanceof UnicodeText) {
            searchChars = searchTerm.characters;
        } else {
            searchChars = UnicodeText.from('' + searchTerm).characters;
        }
        for (let idx = searchChars.length; idx > 0; idx -= 1) {
            if (selfChars[selfChars.length - idx] !== searchChars[searchChars.length - idx]) {
                return false;
            }
        }
        return true;
    }


    includes(searchTerm: string | UnicodeText, startPosition?: number) : boolean {
        return -1 < this.indexOf(searchTerm, startPosition);
    }
    indexOf(searchTerm: string | UnicodeText, startPosition?: number) : number {
        if (searchTerm == null) {
            return -1;
        }

        let matchChars : string[];
        if (searchTerm instanceof UnicodeText) {
            matchChars = searchTerm.characters;
        } else {
            matchChars = UnicodeText.from(searchTerm + '').characters;
        }
        const matchLen = matchChars.length;
        if (matchLen === 0) {
            return 0;
        }

        let idx = Number(startPosition);
        if (!Number.isInteger(idx) || idx < 0) {
            idx = 0;
        }
        const chars = this.chars;
        const len = chars.length, end = len - matchLen;

        if (idx >= end) {
            return -1;
        }
        while (idx < end) {
            let offset = 0;
            while (offset < matchLen) {
                if (chars[idx + offset] === matchChars[offset]) {
                    offset += 1;
                    if (offset === matchLen) {
                        return idx;
                    }
                } else {
                    idx += 1;
                    break;
                }
            }
        }
        return -1;
    }

    // lastIndexOf()   - TODO
    // localeCompare() - TODO

    // match()    - Won't add: regex
    // matchAll() - Won't add: regex

    normalize(form?: "NFC" | "NFD" | "NFKC" | "NFKD") : string {
        return this.toString().normalize(form);
    }
    normalizeUS(form?: "NFC" | "NFD" | "NFKC" | "NFKD") : UnicodeText {
        return UnicodeText.from(this.normalize(form));
    }
    padEnd(length: number, padding : string | UnicodeText = ' ') : string {
        length = Number(length);
        if (!Number.isInteger(length) || length <= this.chars.length) {
            return this.toString();
        }
        let padText : string;
        if (padding == null) {
            padText = ' '.repeat(length - this.chars.length);
        } else if (padding instanceof UnicodeText) {
            padText = padding.toString().repeat(Math.ceil(length / padding.length));
        } else {
            padding = UnicodeText.from(padding);
            padText = padding.toString().repeat(Math.ceil(length / padding.length));
        }
        return UnicodeText.from(this.toString() + padText).slice(0, length);
    }
    padEndUS(length: number, padding: string | UnicodeText = ' ') : UnicodeText {
        return UnicodeText.from(this.padEnd(length, padding));
    }
    padStart(length: number, padding: string | UnicodeText = ' ') : string {
        length = Number(length);
        if (!Number.isInteger(length) || length <= this.chars.length) {
            return this.toString();
        }
        let padText : string;
        if (padding == null) {
            padText = ' '.repeat(length - this.chars.length);
        } else if (padding instanceof UnicodeText) {
            padText = padding.toString().repeat(Math.ceil(length / padding.length));
        } else {
            padding = UnicodeText.from(padding);
            padText = padding.toString().repeat(Math.ceil(length / padding.length));
        }
        return UnicodeText.from(padText + this.toString()).slice(length - this.chars.length);
    }
    padStartUS(length: number, padding: string | UnicodeText = ' ') : UnicodeText {
        return UnicodeText.from(this.padStart(length, padding));
    }
    repeat(count: number) : string {
        return this.valueOf().repeat(count);
    }
    repeatUS(count: number) : UnicodeText {
        return UnicodeText.from(this.repeat(count))
    }

    // replace()    - Won't add: regex
    // replaceAll() - Won't add: regex
    // search()     - Won't add: regex

    slice(start: number, end?: number) : string {
        return this.chars.slice(start, end).join('');
    }
    sliceUS(start: number, end?: number) : UnicodeText {
        return UnicodeText.from(this.slice(start, end));
    }

    // split() - Won't add: regex

    startsWith(searchTerm: string | UnicodeText, startPosition?: number) : boolean {
        if (searchTerm === '') {
            return true;
        }
        startPosition = Number(startPosition);
        if (searchTerm == null || Number.isFinite(startPosition) || this.characters.length <= startPosition) {
            return false;
        }
        let search : string[];
        if (searchTerm instanceof UnicodeText) {
            search = searchTerm.characters;
        } else {
            search = UnicodeText.from('' + searchTerm).characters;
        }
        const chars = this.characters.slice(startPosition);
        for (let idx = 0, end = search.length; idx < end; idx += 1) {
            if (chars[idx] !== search[idx]) {
                return false;
            }
        }
        return true;
    }
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
    substringUS(start: number, end?: number) : UnicodeText {
        return UnicodeText.from(this.substring(start, end));
    }
    toJSON() {
        return this.valueOf();
    }

    // toLocaleLowerCase() - TODO
    // toLocaleUpperCase() - TODO

    toLowerCase() : string {
        return this.valueOf().toLowerCase();
    }
    toLowerCaseUS() : UnicodeText {
        return UnicodeText.from(this.toLowerCase());
    }
    toString() {
        return this.valueOf();
    }
    toUpperCase() : string {
        return this.valueOf().toUpperCase();
    }
    toUpperCaseUS() : UnicodeText {
        return UnicodeText.from(this.toUpperCase());
    }
    trim() : string {
        return this.valueOf().trim();
    }
    trimUS() : UnicodeText {
        return UnicodeText.from(this.trim())
    }
    trimEnd() : string {
        return this.valueOf().trimEnd();
    }
    trimEndUS() : UnicodeText {
        return UnicodeText.from(this.valueOf().trimEnd());
    }
    trimStart() : string {
        return this.valueOf().trimStart();
    }
    trimStartUS() : UnicodeText {
        return UnicodeText.from(this.valueOf().trimStart());
    }
    valueOf() {
        return this.chars.join('');
    }

    [Symbol.iterator]() {
        const chars = this.chars;
        const len = chars.length;
        let idx = 0;
        return <IterableIterator<string>>{
            next() {
                const value : string = chars[idx];
                idx += 1;
                return { done: idx + 1 === len, value };
            },
            return() {
                idx = 0;
                return {done: true}
            }
        }
    }

    [Symbol.toPrimitive]() {
        return this.valueOf();
    }

    static from(subject: unknown) : UnicodeText {
        if (typeof subject === 'function') {
            throw new Error('invalid input')
        } else if (subject == null) {
            subject = '';
        } else if (typeof subject !== 'string') {
            subject = '' + subject;
        }
        return new Proxy(new UnicodeText(<string>subject), {
            get(target, property, reciever) {
                if (typeof property === 'symbol') {
                    return Reflect.get(target, property, reciever);
                }
                if (typeof property === 'number' || Number.isFinite(Number(property))) {
                    return target.chars[<number>(<unknown>property)];
                }
                return Reflect.get(target, property, reciever);
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
    static normalize(subject: string | String | UnicodeText) : string {
        return ('' + subject).normalize("NFC");
    }
}

export default UnicodeText.from;