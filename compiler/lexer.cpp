#include "lexer.h"
#include <cctype>
#include <algorithm>

Lexer::Lexer(const std::string& input) : input(input), pos(0) {}

char Lexer::peek() {
    if (pos >= input.length()) return '\0';
    return input[pos];
}

char Lexer::advance() {
    if (pos >= input.length()) return '\0';
    return input[pos++];
}

void Lexer::skipWhitespace() {
    while (pos < input.length() && std::isspace(input[pos])) {
        pos++;
    }
}

bool Lexer::isAlpha(char c) {
    return std::isalpha(c) || c == '_';
}

bool Lexer::isDigit(char c) {
    return std::isdigit(c);
}

bool Lexer::isAlnum(char c) {
    return std::isalnum(c) || c == '_';
}

std::vector<Token> Lexer::tokenize() {
    std::vector<Token> tokens;
    
    while (pos < input.length()) {
        skipWhitespace();
        if (pos >= input.length()) break;
        
        char c = peek();
        
        if (isAlpha(c)) {
            std::string value;
            while (isAlnum(peek())) {
                value += advance();
            }
            // Check if keyword
            std::string upperVal = value;
            for (char& ch : upperVal) ch = std::toupper(ch);
            
            if (upperVal == "SELECT" || upperVal == "FROM" || upperVal == "WHERE") {
                tokens.push_back({TokenType::KEYWORD, upperVal});
            } else {
                tokens.push_back({TokenType::IDENTIFIER, value});
            }
        } else if (isDigit(c)) {
            std::string value;
            while (isDigit(peek())) {
                value += advance();
            }
            tokens.push_back({TokenType::LITERAL, value});
        } else if (c == '\'' || c == '"') {
            char quote = advance();
            std::string value;
            while (peek() != quote && peek() != '\0') {
                value += advance();
            }
            if (peek() == quote) advance();
            tokens.push_back({TokenType::LITERAL, value});
        } else if (c == '=' || c == '<' || c == '>') {
            std::string value;
            value += advance();
            if (peek() == '=') {
                value += advance();
            }
            tokens.push_back({TokenType::OPERATOR, value});
        } else if (c == ',') {
            advance();
            tokens.push_back({TokenType::UNKNOWN, ","}); // Using UNKNOWN with value "," for simplicity, or I could add a COMMA type.
        } else {
            std::string value;
            value += advance();
            // Handle wildcard *
            if (value == "*") {
                tokens.push_back({TokenType::IDENTIFIER, value});
            } else {
                tokens.push_back({TokenType::UNKNOWN, value});
            }
        }
    }
    
    tokens.push_back({TokenType::END_OF_FILE, ""});
    return tokens;
}
