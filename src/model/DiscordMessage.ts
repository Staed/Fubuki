export default interface DiscordMessage {
    messageID: string,
    authorID: string,
    content: string,
    guildID: string,
    createdTimestamp: number
}