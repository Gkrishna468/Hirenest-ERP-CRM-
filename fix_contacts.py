import re

with open('src/pages/Contacts.tsx', 'r') as f:
    content = f.read()

# Replace dbProxy with UserRepository
content = content.replace("import { dbProxy } from '@/services/firebase/db-proxy';", "import { UserRepository } from '@/repositories/UserRepository';\nimport type { User } from '@/types';")

content = re.sub(
r"        let snapDocs = await dbProxy\.getDocs\('contacts'\);\n        let fetchedContacts: Contact\[\] = snapDocs\.map\(\(data: any\) => \{\n          return \{\n            id: data\.id,\n            name: data\.name \|\| 'Unknown',\n            title: data\.title \|\| '',\n            company: data\.company \|\| '',\n            email: data\.email \|\| '',\n            phone: data\.phone \|\| '',\n            location: data\.location \|\| '',\n            source: data\.source \|\| 'crm',\n            rating: data\.rating,\n            lastMeeting: data\.lastMeeting,\n            birthday: data\.birthday,\n            linkedin: data\.linkedin,\n            callsCount: data\.callsCount,\n            emailsCount: data\.emailsCount,\n            whatsappCount: data\.whatsappCount,\n          \};\n        \}\);\n        setContacts\(fetchedContacts\);",
'''        let users = await UserRepository.list();
        let fetchedContacts: Contact[] = users.map((data: User) => {
          return {
            id: data.id,
            name: data.name || 'Unknown',
            title: data.role || '',
            company: data.companyId || '',
            email: data.email || '',
            phone: data.phone || '',
            location: '',
            source: 'crm',
            rating: 0,
          };
        });
        setContacts(fetchedContacts);''', content)

with open('src/pages/Contacts.tsx', 'w') as f:
    f.write(content)
