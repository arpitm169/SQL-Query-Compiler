# SQL Query Compiler

A compiler-design inspired application that translates SQL queries into structured internal representations through multiple compilation phases. The project demonstrates how database queries are processed by implementing lexical analysis, syntax analysis, and intermediate code generation using custom-built compiler components.

The system tokenizes SQL statements, constructs a parse tree to validate query structure, and generates a relational algebra based intermediate representation that models how database systems internally interpret queries before execution. The generated outputs are visualized through an interactive web interface, allowing users to observe each stage of the compilation process.

## Features

- Performs lexical analysis to identify keywords, identifiers, operators, and literals.
- Builds a parse tree using a custom recursive-descent parser.
- Generates intermediate code in the form of relational algebra operations.
- Visualizes tokens, parse trees, and IR structures in an interactive interface.
- Provides query validation and error handling for invalid SQL syntax.
- Demonstrates core compiler design and database query processing concepts.

## Technologies Used

- **C++** for compiler implementation
- **HTML5** for frontend structure
- **CSS3** for UI styling and visualization
- **JavaScript** for frontend interaction and rendering

## Key Concepts Demonstrated

- Lexical Analysis
- Syntax Analysis
- Parse Trees
- Intermediate Representation (IR)
- Relational Algebra
- Compiler Construction
- Database Query Processing

## Future Enhancements

- Support for JOIN operations
- Query optimization techniques
- Semantic analysis
- Additional SQL clauses and functions
- Execution plan generation
- Database integration

![image alt](https://github.com/arpitm169/SQL-Query-Compiler/blob/14648efe977f5bda93df61df1c4722833f214467/Screenshot%202026-06-11%20231818.png)
![image alt](https://github.com/arpitm169/SQL-Query-Compiler/blob/a2c61d97d04e2c42fc6f356e27ae6d30c5c289a9/Screenshot%202026-06-11%20231829.png)
![image alt](https://github.com/arpitm169/SQL-Query-Compiler/blob/ec0fa76953c10d48a8918bea0dae0fdc3ee12073/Screenshot%202026-06-11%20231837.png)
![image alt]()



## Author

**Arpit Malhotra**
