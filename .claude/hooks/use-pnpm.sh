#!/bin/bash

# Read input from stdin
input_data=$(cat)

# Parse JSON using jq (assumes jq is available)
tool=$(echo "$input_data" | jq -r '.tool_name // empty')
command=$(echo "$input_data" | jq -r '.tool_input.command // empty')

# Check if this is a Bash tool call
if [[ "$tool" != "Bash" ]]; then
    # Not a Bash command, allow it to proceed
    echo '{"decision": "approve"}'
    exit 0
fi

# List of prohibited package managers
prohibited_managers=("npm" "yarn")

# Check if the command contains any prohibited package manager
for manager in "${prohibited_managers[@]}"; do
    if [[ "$command" == *"$manager"* ]]; then
        # Replace the prohibited manager with pnpm
        modified_command=$(echo "$command" | sed "s/\b$manager\b/pnpm/g")
        
        # Create response JSON
        response=$(jq -n \
            --arg original "$command" \
            --arg suggested "$modified_command" \
            --arg manager "$manager" \
            '{
                decision: "block",
                reason: ($manager + " commands are not allowed. Use pnpm instead.\nOriginal: " + $original + "\nSuggested: " + $suggested)
            }')
        
        echo "$response"
        exit 0
    fi
done

# Allow commands without prohibited package managers to proceed
echo '{"decision": "approve"}'
exit 0
