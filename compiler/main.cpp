#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include "lexer.h"
#include "parser.h"
#include "ir.h"

std::string escapeJSON(const std::string& s) {
    std::ostringstream o;
    for (auto c : s) {
        if (c == '"') o << "\\\"";
        else if (c == '\\') o << "\\\\";
        else if (c == '\b') o << "\\b";
        else if (c == '\f') o << "\\f";
        else if (c == '\n') o << "\\n";
        else if (c == '\r') o << "\\r";
        else if (c == '\t') o << "\\t";
        else o << c;
    }
    return o.str();
}

std::string tokenTypeToString(TokenType type) {
    switch (type) {
        case TokenType::KEYWORD: return "KEYWORD";
        case TokenType::IDENTIFIER: return "IDENTIFIER";
        case TokenType::OPERATOR: return "OPERATOR";
        case TokenType::LITERAL: return "LITERAL";
        case TokenType::END_OF_FILE: return "EOF";
        default: return "UNKNOWN";
    }
}

void printJSON(const std::vector<Token>& tokens, Node* parseTree, Node* irTree) {
    std::cout << "{\n";
    
    // 1. Tokens
    std::cout << "  \"tokens\": [\n";
    bool firstToken = true;
    for (size_t i = 0; i < tokens.size(); ++i) {
        if (tokens[i].type == TokenType::END_OF_FILE) continue;
        if (!firstToken) std::cout << ",\n";
        std::cout << "    {\"type\": \"" << tokenTypeToString(tokens[i].type) 
                  << "\", \"value\": \"" << escapeJSON(tokens[i].value) << "\"}";
        firstToken = false;
    }
    std::cout << "\n  ],\n";
    
    // Recursive printer for both trees
    auto printNode = [&](auto self, Node* node) -> void {
        if (!node) { std::cout << "null"; return; }
        std::cout << "{\"node\": \"" << escapeJSON(node->type) << "\"";
        if (!node->value.empty()) {
            std::cout << ", \"value\": \"" << escapeJSON(node->value) << "\"";
        }
        std::cout << ", \"children\": [";
        for (size_t i = 0; i < node->children.size(); ++i) {
            self(self, node->children[i]);
            if (i < node->children.size() - 1) std::cout << ",";
        }
        std::cout << "]}";
    };
    
    // 2. Parse Tree
    std::cout << "  \"parseTree\": ";
    printNode(printNode, parseTree);
    std::cout << ",\n";
    
    // 3. IR Tree
    std::cout << "  \"irTree\": ";
    printNode(printNode, irTree);
    std::cout << "\n";
    
    std::cout << "}\n";
}

int main() {
    // Read all input from stdin
    std::string query;
    std::string line;
    while (std::getline(std::cin, line)) {
        query += line + " ";
    }
    
    if (query.empty()) return 0;

    // 1. Lexical Analysis
    Lexer lexer(query);
    std::vector<Token> tokens = lexer.tokenize();
    
    // 2. Syntax Analysis
    Parser parser(tokens);
    Node* parseTree = parser.parse();
    
    // 3. IR Generation
    IRGenerator irGen;
    Node* irTree = irGen.generate(parseTree);
    
    // Output as JSON
    printJSON(tokens, parseTree, irTree);
    
    delete parseTree;
    if (irTree) delete irTree;
    return 0;
}
