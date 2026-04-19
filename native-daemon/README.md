# Tadpole Native Daemon - Linux BG3 Compatibility

This daemon provides native Linux BG3 support without requiring Proton or BG3 Script Extender.

## Architecture

```
BG3 (Native ELF)  <--->  TadpoleNativeDaemon  <--->  Bridge (Port 3456)
     (Memory)           (Memory Reader)           (WebSocket)
                            (Unix Socket)
```

## How It Works

1. **Memory Reading**: Scans BG3's process memory for game state using known patterns
2. **Pattern Matching**: Uses heuristic scanning to find HP, gold, party data
3. **Command Injection**: Writes commands to a shared memory area that BG3 can read
4. **Socket API**: Exposes simple JSON API over Unix socket at `/tmp/tadpole_native.sock`

## Building

```bash
cd native-daemon
make
```

## Running

```bash
# The daemon auto-detects running BG3 process
./tadpole-native
```

## Dependencies

- Linux with /proc filesystem
- C++17 compiler
- libpthread, libdl

## Limitations

- Memory patterns may break with BG3 updates
- Command injection is experimental
- No event notifications (combat started/ended, etc.)
