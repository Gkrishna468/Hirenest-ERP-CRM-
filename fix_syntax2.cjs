const fs = require('fs');
let content = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');

content = content.replace(
  `              )}
                
              </div>
              )}
            </div>
          </div>
        </div>
      )}`,
  `              )}
            </div>
          </div>
        </div>
      )}`
);

fs.writeFileSync('src/pages/Vendors.tsx', content);
