#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <cstring>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <sys/types.h>
#include <dirent.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <nlohmann/json.hpp>
#include <signal.h>
#include <atomic>

using json = nlohmann::json;
using namespace std;

#define SOCKET_PATH "/tmp/tadpole_native.sock"
#define MEMORY_SCAN_SIZE 1024 * 1024 * 100  // Scan first 100MB

atomic<bool> running(true);

// Memory pattern for gold (searching for integer values)
struct MemoryPattern {
    const char* name;
    vector<uint8_t> pattern;
    size_t offset;
};

// Find BG3 process by name
pid_t find_bg3_process() {
    DIR* proc = opendir("/proc");
    if (!proc) return -1;

    struct dirent* entry;
    while ((entry = readdir(proc)) != nullptr) {
        if (!isdigit(entry->d_name[0])) continue;

        string pid_path = string("/proc/") + entry->d_name + "/cmdline";
        ifstream cmdline(pid_path);
        if (!cmdline.is_open()) continue;

        string line;
        getline(cmdline, line, '\0');

        if (line.find("bg3") != string::npos &&
            line.find("Baldurs Gate") != string::npos) {
            closedir(proc);
            return atoi(entry->d_name);
        }
    }

    closedir(proc);
    return -1;
}

// Read process memory
bool read_process_memory(pid_t pid, uintptr_t addr, void* buffer, size_t size) {
    string mem_path = "/proc/" + to_string(pid) + "/mem";
    int fd = open(mem_path.c_str(), O_RDONLY);
    if (fd < 0) return false;

    bool success = pread(fd, buffer, size, addr) == (ssize_t)size;
    close(fd);
    return success;
}

// Scan memory for pattern
vector<uintptr_t> scan_memory(pid_t pid, const vector<uint8_t>& pattern, size_t max_results = 10) {
    vector<uintptr_t> results;
    string mem_path = "/proc/" + to_string(pid) + "/mem";
    int fd = open(mem_path.c_str(), O_RDONLY);
    if (fd < 0) return results;

    vector<uint8_t> buffer(4096);
    uintptr_t base_addr = 0;

    while (base_addr < MEMORY_SCAN_SIZE && results.size() < max_results) {
        ssize_t bytes_read = pread(fd, buffer.data(), buffer.size(), base_addr);
        if (bytes_read <= 0) break;

        // Naive pattern matching
        for (size_t i = 0; i <= (size_t)bytes_read - pattern.size(); i++) {
            bool match = true;
            for (size_t j = 0; j < pattern.size(); j++) {
                if (buffer[i + j] != pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                results.push_back(base_addr + i);
            }
        }

        base_addr += bytes_read;
    }

    close(fd);
    return results;
}

// Extract game state from memory (placeholder - needs actual BG3 memory layout)
json extract_game_state(pid_t pid) {
    json state;

    // For now, return a mock state
    // In a real implementation, we'd need to reverse-engineer BG3's memory layout

    state["timestamp"] = chrono::duration_cast<chrono::milliseconds>(
        chrono::system_clock::now().time_since_epoch()
    ).count();

    state["host"] = {
        {"guid", "unknown"},
        {"name", "Unknown Hero"},
        {"hp", 0},
        {"maxHp", 1},
        {"level", 1}
    };

    state["party"] = json::array();
    state["gold"] = 0;
    state["inCombat"] = false;
    state["area"] = "unknown";

    // TODO: Implement actual memory scanning for BG3
    // This requires:
    // 1. Finding base addresses of BG3's data structures
    // 2. Understanding the memory layout of player data
    // 3. Pattern matching for HP, gold, etc.

    return state;
}

// Execute command in BG3 (placeholder)
bool execute_command(pid_t pid, const json& cmd) {
    string action = cmd.value("action", "");

    if (action == "trigger_rest") {
        // TODO: Inject rest command
        return true;
    } else if (action == "heal") {
        // TODO: Inject heal command
        return true;
    } else if (action == "add_gold") {
        // TODO: Inject gold command
        return true;
    }

    return false;
}

// Handle client connection
void handle_client(int client_fd, pid_t bg3_pid) {
    char buffer[4096];
    ssize_t bytes_read = read(client_fd, buffer, sizeof(buffer) - 1);
    if (bytes_read <= 0) {
        close(client_fd);
        return;
    }

    buffer[bytes_read] = '\0';
    string request(buffer);

    try {
        json req = json::parse(request);
        string type = req.value("type", "");

        json response;
        response["success"] = true;

        if (type == "get_state") {
            response["data"] = extract_game_state(bg3_pid);
        } else if (type == "execute") {
            response["success"] = execute_command(bg3_pid, req["data"]);
        } else {
            response["success"] = false;
            response["error"] = "Unknown command type";
        }

        string response_str = response.dump() + "\n";
        write(client_fd, response_str.c_str(), response_str.size());

    } catch (const exception& e) {
        json error;
        error["success"] = false;
        error["error"] = string("JSON parse error: ") + e.what();
        string error_str = error.dump() + "\n";
        write(client_fd, error_str.c_str(), error_str.size());
    }

    close(client_fd);
}

// Unix socket server
void run_socket_server(pid_t bg3_pid) {
    int server_fd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (server_fd < 0) {
        cerr << "Failed to create socket" << endl;
        return;
    }

    // Remove existing socket file
    unlink(SOCKET_PATH);

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, SOCKET_PATH, sizeof(addr.sun_path) - 1);

    if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        cerr << "Failed to bind socket" << endl;
        close(server_fd);
        return;
    }

    if (listen(server_fd, 5) < 0) {
        cerr << "Failed to listen on socket" << endl;
        close(server_fd);
        return;
    }

    chmod(SOCKET_PATH, 0666);  // Allow anyone to connect

    cout << "Native daemon running on " << SOCKET_PATH << endl;
    cout << "BG3 PID: " << bg3_pid << endl;

    while (running) {
        fd_set read_fds;
        FD_ZERO(&read_fds);
        FD_SET(server_fd, &read_fds);

        struct timeval timeout = {1, 0};  // 1 second timeout
        int ready = select(server_fd + 1, &read_fds, nullptr, nullptr, &timeout);

        if (ready < 0) {
            if (errno == EINTR) continue;
            cerr << "select error" << endl;
            break;
        }

        if (ready > 0 && FD_ISSET(server_fd, &read_fds)) {
            int client_fd = accept(server_fd, nullptr, nullptr);
            if (client_fd >= 0) {
                handle_client(client_fd, bg3_pid);
            }
        }
    }

    close(server_fd);
    unlink(SOCKET_PATH);
}

int main() {
    cout << "Tadpole Native Daemon - Linux BG3 Compatibility" << endl;
    cout << "==============================================" << endl;

    // Find BG3 process
    pid_t bg3_pid = find_bg3_process();
    if (bg3_pid < 0) {
        cerr << "ERROR: BG3 process not found" << endl;
        cerr << "Make sure Baldur's Gate 3 is running" << endl;
        return 1;
    }

    cout << "Found BG3 process: PID " << bg3_pid << endl;

    // Set up signal handlers
    signal(SIGINT, [](int) { running = false; });
    signal(SIGTERM, [](int) { running = false; });

    // Run socket server
    run_socket_server(bg3_pid);

    cout << "Daemon stopped" << endl;
    return 0;
}
