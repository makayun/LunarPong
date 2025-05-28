import { GUID, User } from "../defines/types";
import { generateGuid } from "../helpers/helpers";

let users: User[] = [];
const wm = new WeakMap<User, GUID>();

// generating users
for (let i = 0; i < 5; i++) {
	users.push({id: generateGuid()});
}
console.log(users.length);

const someId = users[2].id;

// setting a user to the WeakMap
{
	let someUser = users.find(user => user.id === someId);
	if (someUser)
		wm.set(someUser, someUser.id);
}

// checking if the WeakMap contains a user with this id
{
	let someUser = users.find(user => user.id === someId);
	console.log(wm.has(someUser as User));
}

// deleting the user with this id from the array
users = users.filter(users => users.id !== someId);
console.log(users.length);

// checking whether the WeakMap still contains a user with this id
{
	let someUser = users.find(user => user.id === someId);
	console.log(wm.has(someUser as User));
}
