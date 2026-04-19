CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2 -g
LDFLAGS = -lpthread -ldl

# Install nlohmann/json if not present
JSON_INCLUDE = /usr/local/include/nlohmann
JSON_URL = https://github.com/nlohmann/json/releases/download/v3.11.2/json.hpp
JSON_TARGET = $(JSON_INCLUDE)/json.hpp

# Source files
SRCS = tadpole-native.cpp
OBJS = $(SRCS:.cpp=.o)
TARGET = tadpole-native

.PHONY: all clean install-deps

all: $(TARGET)

# Install json.hpp if missing
install-deps:
	@echo "Installing nlohmann/json..."
	@mkdir -p $(JSON_INCLUDE)
	@curl -L $(JSON_URL) -o $(JSON_TARGET) || wget $(JSON_URL) -O $(JSON_TARGET)

$(TARGET): $(OBJS)
	$(CXX) $(OBJS) -o $(TARGET) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -I/usr/local/include -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET)

install: $(TARGET)
	install -m 755 $(TARGET) /usr/local/bin/tadpole-native

uninstall:
	rm -f /usr/local/bin/tadpole-native
