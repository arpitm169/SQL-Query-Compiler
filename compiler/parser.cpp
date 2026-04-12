#include "parser.h"
#include <iostream>

Parser::Parser(const std::vector<Token>& tokens) : tokens(tokens), pos(0) {}

Token Parser::peek() {
    if (pos >= tokens.size()) return {TokenType::END_OF_FILE, ""};
    return tokens[pos];
}

Token Parser::advance() {
    if (!isAtEnd()) pos++;
    return tokens[pos - 1];
}

bool Parser::isAtEnd() {
    return peek().type == TokenType::END_OF_FILE;
}

bool Parser::match(TokenType type, const std::string& value) {
    if (isAtEnd()) return false;
    Token current = peek();
    if (current.type != type) return false;
    if (!value.empty() && current.value != value) return false;
    advance();
    return true;
}

Node* Parser::parse() {
    return parseSelectStatement();
}

Node* Parser::parseSelectStatement() {
    Node* stmt = new Node("SELECT_STATEMENT");
    
    Node* selectList = parseSelectList();
    if (selectList) {
        stmt->children.push_back(selectList);
    } else {
        std::cerr << "Expected SELECT clause\n";
    }
    
    Node* fromClause = parseFromClause();
    if (fromClause) {
        stmt->children.push_back(fromClause);
    } else {
        std::cerr << "Expected FROM clause\n";
    }
    
    if (peek().type == TokenType::KEYWORD && peek().value == "WHERE") {
        Node* whereClause = parseWhereClause();
        if (whereClause) {
            stmt->children.push_back(whereClause);
        }
    }
    
    return stmt;
}

Node* Parser::parseSelectList() {
    if (!match(TokenType::KEYWORD, "SELECT")) return nullptr;
    
    Node* listNode = new Node("SELECT_LIST");
    
    do {
        if (peek().type == TokenType::IDENTIFIER) {
            Token col = advance();
            listNode->children.push_back(new Node("COLUMN", col.value));
        } else {
            // Error handling or skip unknown
            break;
        }
    } while (peek().type == TokenType::UNKNOWN && peek().value == "," && advance().value == ",");
    
    return listNode;
}

Node* Parser::parseFromClause() {
    if (!match(TokenType::KEYWORD, "FROM")) return nullptr;
    
    Node* fromNode = new Node("FROM_CLAUSE");
    
    do {
        if (peek().type == TokenType::IDENTIFIER) {
            Token table = advance();
            fromNode->children.push_back(new Node("TABLE", table.value));
        } else {
            break;
        }
    } while (peek().type == TokenType::UNKNOWN && peek().value == "," && advance().value == ",");
    
    return fromNode;
}

Node* Parser::parseWhereClause() {
    if (!match(TokenType::KEYWORD, "WHERE")) return nullptr;
    
    Node* whereNode = new Node("WHERE_CLAUSE");
    
    if (peek().type == TokenType::IDENTIFIER) {
        Token col = advance();
        if (peek().type == TokenType::OPERATOR) {
            Token op = advance();
            if (peek().type == TokenType::LITERAL || peek().type == TokenType::IDENTIFIER) {
                Token val = advance();
                
                Node* condition = new Node("CONDITION");
                condition->children.push_back(new Node("COLUMN", col.value));
                condition->children.push_back(new Node("OPERATOR", op.value));
                condition->children.push_back(new Node("VALUE", val.value));
                
                whereNode->children.push_back(condition);
            }
        }
    }
    
    return whereNode;
}
