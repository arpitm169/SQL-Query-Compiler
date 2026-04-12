#pragma once
#include <string>
#include <vector>

enum class TokenType {
    KEYWORD,
    IDENTIFIER,
    OPERATOR,
    LITERAL,
    END_OF_FILE,
    UNKNOWN
};

struct Token {
    TokenType type;
    std::string value;
};

class Lexer {
public:
    Lexer(const std::string& input);
    std::vector<Token> tokenize();
private:
    std::string input;
    size_t pos;
    char peek();
    char advance();
    void skipWhitespace();
    bool isAlpha(char c);
    bool isDigit(char c);
    bool isAlnum(char c);
};
