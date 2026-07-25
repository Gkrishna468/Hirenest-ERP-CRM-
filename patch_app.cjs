const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  '              <Route\n                path="/migration"\n                element={\n                  <PrivateRoute>\n                    <MigrationDashboard />\n                  </PrivateRoute>\n                }\n              />',
  ''
);
fs.writeFileSync('src/App.tsx', content);
