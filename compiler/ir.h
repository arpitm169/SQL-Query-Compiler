#pragma once
#include "parser.h"
#include <string>

class IRGenerator {
public:
    Node* generate(Node* root);
private:
    Node* generateProject(Node* selectList);
    Node* generateSelect(Node* whereClause);
    Node* generateScan(Node* fromClause);
};
