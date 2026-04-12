#include "ir.h"
#include <sstream>

Node* IRGenerator::generate(Node* root) {
    if (!root || root->type != "SELECT_STATEMENT") return nullptr;
    
    Node* selectList = nullptr;
    Node* fromClause = nullptr;
    Node* whereClause = nullptr;
    
    for (Node* child : root->children) {
        if (child->type == "SELECT_LIST") selectList = child;
        else if (child->type == "FROM_CLAUSE") fromClause = child;
        else if (child->type == "WHERE_CLAUSE") whereClause = child;
    }
    
    // Bottom-up construction (conceptually)
    // 1. Scan/Join
    Node* base = generateScan(fromClause);
    
    // 2. Select
    Node* selection = generateSelect(whereClause);
    if (selection) {
        selection->children.push_back(base);
        base = selection;
    }
    
    // 3. Project
    Node* projection = generateProject(selectList);
    if (projection) {
        projection->children.push_back(base);
        base = projection;
    }
    
    return base;
}

Node* IRGenerator::generateProject(Node* selectList) {
    if (!selectList || selectList->children.empty()) return new Node("Π", "*");
    
    std::string cols = "";
    for (size_t i = 0; i < selectList->children.size(); i++) {
        if (i > 0) cols += ", ";
        cols += selectList->children[i]->value;
    }
    return new Node("Π", cols);
}

Node* IRGenerator::generateSelect(Node* whereClause) {
    if (!whereClause || whereClause->children.empty()) return nullptr;
    
    Node* cond = whereClause->children[0];
    if (cond && cond->children.size() == 3) {
        std::string col = cond->children[0]->value;
        std::string op = cond->children[1]->value;
        std::string val = cond->children[2]->value;
        return new Node("σ", col + " " + op + " " + val);
    }
    return new Node("σ", "true");
}

Node* IRGenerator::generateScan(Node* fromClause) {
    if (!fromClause || fromClause->children.empty()) return new Node("SCAN", "dual");
    
    if (fromClause->children.size() > 1) {
        // Cross product / Join
        Node* joinNode = new Node("⨝");
        for (Node* child : fromClause->children) {
            joinNode->children.push_back(new Node("SCAN", child->value));
        }
        return joinNode;
    }
    
    return new Node("SCAN", fromClause->children[0]->value);
}
