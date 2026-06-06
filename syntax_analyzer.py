
import re

def tokenize(statement):
    """Tokenize the input statement"""
    # Define token patterns
    patterns = [
        (r'\bprint\b', 'PRINT'),
        (r'[a-zA-Z_][a-zA-Z0-9_]*', 'IDENTIFIER'),
        (r'=', 'ASSIGN'),
        (r'\+', 'PLUS'),
        (r'\*', 'MULTIPLY'),
        (r'\(', 'LPAREN'),
        (r'\)', 'RPAREN'),
        (r';', 'SEMICOLON'),
        (r'\s+', None)  
    ]
    
    tokens = []
    i = 0
    statement = statement.strip()
    
    while i < len(statement):
        matched = False
        for pattern, token_type in patterns:
            regex = re.compile('^' + pattern)
            match = regex.match(statement[i:])
            if match:
                value = match.group(0)
                if token_type:  # Don't add whitespace
                    tokens.append((value, token_type))
                i += len(value)
                matched = True
                break
        if not matched:
            # Unknown character
            tokens.append((statement[i], 'UNKNOWN'))
            i += 1
    return tokens


def check_syntax(statement):
    """Check if statement matches any of the three rules"""
    tokens = tokenize(statement)
    
    # Remove token types, keep only values for pattern matching
    token_values = [t[0] for t in tokens]
    
    # Rule 1: Identifier = Identifier + Identifier ;
    if (len(token_values) == 6 and 
        token_values[1] == '=' and 
        token_values[3] == '+' and 
        token_values[5] == ';'):
        return "Valid Statement (Rule 1)"
    
    # Rule 2: Identifier = Identifier * Identifier ;
    elif (len(token_values) == 6 and 
          token_values[1] == '=' and 
          token_values[3] == '*' and 
          token_values[5] == ';'):
        return "Valid Statement (Rule 2)"
    elif (len(token_values) == 6 and 
          token_values[0] == 'print' and 
          token_values[1] == '(' and 
          token_values[3] == ')' and 
          token_values[5] == ';'):
        return "Valid Statement (Rule 3)"
    
    else:
        return "Invalid Statement"


# Main Program
if __name__ == "__main__":
    print("=== Simple Syntax Analyzer ===\n")
    statement = input("Enter statement: ").strip()
    
    result = check_syntax(statement)
    print("\nOutput:", result)