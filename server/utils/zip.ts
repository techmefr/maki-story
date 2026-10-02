import { crc32 } from 'node:zlib'

export interface IZipEntry {
    name: string
    data: Buffer
}

interface ICentralRecord {
    name: Buffer
    crc: number
    size: number
    offset: number
    dosTime: number
    dosDate: number
}

const LOCAL_SIGNATURE = 0x04034b50
const CENTRAL_SIGNATURE = 0x02014b50
const END_SIGNATURE = 0x06054b50
const UTF8_FLAG = 0x0800
const VERSION = 20
const MAX_ENTRIES = 65535
const MAX_SIZE = 0xffffffff

const dosParts = (date: Date): { dosTime: number; dosDate: number } => ({
    dosTime: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2),
    dosDate: ((Math.max(date.getUTCFullYear(), 1980) - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
})

const localHeader = (record: ICentralRecord): Buffer => {
    const header = Buffer.alloc(30)
    header.writeUInt32LE(LOCAL_SIGNATURE, 0)
    header.writeUInt16LE(VERSION, 4)
    header.writeUInt16LE(UTF8_FLAG, 6)
    header.writeUInt16LE(0, 8)
    header.writeUInt16LE(record.dosTime, 10)
    header.writeUInt16LE(record.dosDate, 12)
    header.writeUInt32LE(record.crc, 14)
    header.writeUInt32LE(record.size, 18)
    header.writeUInt32LE(record.size, 22)
    header.writeUInt16LE(record.name.length, 26)
    header.writeUInt16LE(0, 28)
    return Buffer.concat([header, record.name])
}

const centralHeader = (record: ICentralRecord): Buffer => {
    const header = Buffer.alloc(46)
    header.writeUInt32LE(CENTRAL_SIGNATURE, 0)
    header.writeUInt16LE(VERSION, 4)
    header.writeUInt16LE(VERSION, 6)
    header.writeUInt16LE(UTF8_FLAG, 8)
    header.writeUInt16LE(0, 10)
    header.writeUInt16LE(record.dosTime, 12)
    header.writeUInt16LE(record.dosDate, 14)
    header.writeUInt32LE(record.crc, 16)
    header.writeUInt32LE(record.size, 20)
    header.writeUInt32LE(record.size, 24)
    header.writeUInt16LE(record.name.length, 28)
    header.writeUInt32LE(record.offset, 42)
    return Buffer.concat([header, record.name])
}

const endOfArchive = (count: number, centralSize: number, centralOffset: number): Buffer => {
    const end = Buffer.alloc(22)
    end.writeUInt32LE(END_SIGNATURE, 0)
    end.writeUInt16LE(count, 8)
    end.writeUInt16LE(count, 10)
    end.writeUInt32LE(centralSize, 12)
    end.writeUInt32LE(centralOffset, 16)
    return end
}

export async function* zipStream(entries: AsyncIterable<IZipEntry> | Iterable<IZipEntry>, now: Date = new Date()): AsyncGenerator<Buffer> {
    const records: ICentralRecord[] = []
    const { dosTime, dosDate } = dosParts(now)
    let offset = 0
    for await (const entry of entries) {
        if (records.length >= MAX_ENTRIES || offset + entry.data.length >= MAX_SIZE) {
            throw new Error('The archive is too large')
        }
        const record: ICentralRecord = { name: Buffer.from(entry.name, 'utf8'), crc: crc32(entry.data), size: entry.data.length, offset, dosTime, dosDate }
        const header = localHeader(record)
        records.push(record)
        offset += header.length + entry.data.length
        yield header
        yield entry.data
    }
    const central = Buffer.concat(records.map(centralHeader))
    yield central
    yield endOfArchive(records.length, central.length, offset)
}
