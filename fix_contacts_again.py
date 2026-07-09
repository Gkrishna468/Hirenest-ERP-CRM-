with open('src/pages/Contacts.tsx', 'r') as f:
    content = f.read()

content = content.replace("await dbProxy.updateDoc('contacts', ", "await UserRepository.update(")
content = content.replace("const result = await dbProxy.addDoc('contacts', payload);", "const result = await UserRepository.create(crypto.randomUUID(), payload);")

# Also replace the fetch part
import re
content = re.sub(r"let snapDocs = await dbProxy\.getDocs\('contacts'\);.*?setContacts\(fetchedContacts\);", 
'''        let users = await UserRepository.list();
        let fetchedContacts: Contact[] = users.map((data: any) => {
          return {
            id: data.id,
            name: data.name || 'Unknown',
            title: data.role || '',
            company: data.companyId || '',
            email: data.email || '',
            phone: data.phone || '',
            location: '',
            source: 'crm',
            rating: data.rating || 0,
            lastMeeting: data.lastMeeting,
            birthday: data.birthday,
            linkedin: data.linkedin,
            callsCount: data.callsCount,
            emailsCount: data.emailsCount,
            whatsappCount: data.whatsappCount,
          } as Contact;
        });
        setContacts(fetchedContacts);''', content, flags=re.DOTALL)

with open('src/pages/Contacts.tsx', 'w') as f:
    f.write(content)
