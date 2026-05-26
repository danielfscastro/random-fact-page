# Product Overview

Random Fact Page is a web application that displays random facts to users. It fetches facts from an external API with a local fallback collection, ensuring users always see content even when the network is unavailable.

Key behaviors:
- Displays a random fact from a curated collection or external API
- Avoids showing the same fact consecutively
- Falls back to local facts when the API is unreachable or returns invalid data
- Validates all facts against a strict schema before display
