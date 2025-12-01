export class Logger {
    static log(logType: LogType, message: string, guildId?: string): void {
        const timestamp = new Date().toISOString();
        console.log(`${getColorForLogType(logType)}[System | ${logType}] ${timestamp}: ${message} ${guildId ? `(guildId: ${guildId})` : ''}${LogColors.Reset}`);
    }
}


export enum LogType {
    CommandSync = "Command Syncronization",
    CommandExecution = "Command Execution",
    EventHandling = "Event Handling",
    Error = "Error",
    Warning = "Warning",
    StartUp = "Start Up",
    GuildCreation = "Guild Creation",
    GuildDeletion = "Guild Deletion",
    GuildConfigDeletion = "Guild Config Deletion",
    GuildConfigCreation = "Guild Config Creation",
    BetterStackStatusUpdate = "BetterStack Status Update",
};

function getColorForLogType(logType: LogType): string {
    switch (logType) {
        case LogType.Error:
            return LogColors.Red;

        case LogType.Warning:
            return LogColors.Yellow;

        case LogType.StartUp:
            return LogColors.GreenUnderline;

        case LogType.GuildCreation:
        case LogType.GuildConfigCreation:
            return LogColors.Green;

        case LogType.GuildDeletion:
        case LogType.GuildConfigDeletion:
            return LogColors.Magenta;

        case LogType.BetterStackStatusUpdate:
            return LogColors.BrightCyan;

        case LogType.CommandSync:
            return LogColors.BrightBlue;

        case LogType.CommandExecution:
            return LogColors.Cyan;

        case LogType.EventHandling:
            return LogColors.BrightMagenta;

        default:
            return LogColors.White;
    }
}

enum LogColors {
    Reset = "\x1b[0m",

    Red = "\x1b[31m",
    Yellow = "\x1b[33m",
    Green = "\x1b[32m",
    Cyan = "\x1b[36m",
    Blue = "\x1b[34m",
    Magenta = "\x1b[35m",
    White = "\x1b[37m",

    GreenUnderline = "\x1b[4;32m",

    BrightBlue = "\x1b[94m",
    BrightMagenta = "\x1b[95m",
    BrightCyan = "\x1b[96m",
}
