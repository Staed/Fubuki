export default class Instruction {
    public endpoint: string;
    public reply?: string;

    public constructor(endpoint: string, reply?: string) {
        this.endpoint = endpoint;
        if (reply !== undefined)
            this.reply = reply;
    }

    public stringify(): string {
        return JSON.stringify(this);
    }
}