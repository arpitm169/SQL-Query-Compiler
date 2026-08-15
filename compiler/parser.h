#pragma once
#include "lexer.h"
#include <vector>
#include <string>

struct Node {
    std::string type;
    std::string value;
    std::vector<Node*> children;
    
    Node(std::string t, std::string v = "") : type(t), value(v) {}
    ~Node() {
        for (Node* child : children) {
            delete child;
        }
    }
};

class Parser {
public:
    Parser(const std::vector<Token>& tokens);
    Node* parse();

private:
    std::vector<Token> tokens;
    size_t pos;
    Token peek();
    Token advance();
    bool match(TokenType type, const std::string& value = "");
    bool isAtEnd();
    
    Node* parseSelectStatement();
    Node* parseSelectList();
    Node* parseFromClause();
    Node* parseWhereClause();
};
