const {VK, Keyboard} = require('vk-io');
const vk = new VK();
const {updates} = vk;
const fs = require("fs"); 
const users = require("./base/users.json");
const tokens = require("./base/tokens.json");  

/////////////////////////The script is redone and merged SEDIS////////////////////////////////

vk.updates.on(['chat_invite_user'], async (message, next) => { 
	vk.api.call("messages.getConversationMembers", {
		peer_id: 2000000000 + message.chatId, 
	})
	if(message.payload.action.member_id == message.senderId) return; 
	if(users.users[message.payload.action.member_id].ban == true){
	vk.api.call("messages.removeChatUser", { chat_id: message.chatId, user_id: message.payload.acion.member_id })
	await next();
	}
	});

setInterval(function(){
	fs.writeFileSync("./base/users.json", JSON.stringify(users, null, "\t"))  
	fs.writeFileSync("./base/tokens.json", JSON.stringify(tokens, null, "\t")) 
}, 1500);

/////////////////////////The script is redone and merged SEDIS////////////////////////////////

vk.setOptions({
	token: tokens.token,
	apiMode: 'parallel',
	pollingGroupId: tokens.id
});

function new_user(id){
	if(!users.users[id]){
		users.users[id] = {
			admin_level: 0,
			ban: false,
			warn: 0
		}
	}
} 

vk.updates.use(async (message, next) => {  
	if (message.is("message") && message.isOutbox) {return;}
	message.user = message.senderId; message.text = message.payload.text;  
	if (!message.text) return;
	new_user(message.user);
	if(users.users[message.user].ban == true) {return;}
	try { await next(); } catch (err) { console.error(err) }
});


/////////////////////////The script is redone and merged SEDIS////////////////////////////////

vk.updates.hear(/^(?:!помощь)/i, (message) => { 
	let user = users.users[message.user];

	return message.send(`
		 ⚙Префикс бота - !
		 ⚙Помощь - функции бота.
		 ⚙ping - проверка работоспособности.
		 ⚙инфо - важная инфа
		 ⚙дз - домашка
	     ⚙расписание (день недели) - расписание
		- - - - - - - - - - - - - - - - - - -
        Бот создан @idinaxyidyraebanya (Просто Олёша) По совместительству @shaluniska0 (Андрей Андреев)`);
});

vk.updates.hear(/^(?:!kick)(\s?https\:\/\/vk\.com\/)?(id)?([0-9]+)?([^]+)?/i, (message) => { 
	let user = users.users[message.user];
	if(user.admin_level < 1) return;

	if(message.$match[4]) { 
		var domain = message.$match[4].split(" "); 
		vk.api.call("utils.resolveScreenName", { 
		screen_name: message.$match[4] 
	}).then((res) => { 
		new_user(res.object_id);
		if(users.users[res.object_id].admin_level == 2) return message.reply('Отказ'); 
		vk.api.call("messages.removeChatUser", {chat_id: message.chatId, user_id: res.object_id })
		.catch((error) => {return message.send(`Error.`);
		});  
		return  
		})  
	}else{
		if(!message.$match[3]) return message.reply("ID пользователя не указан"); 
		new_user(message.$match[3]);
		if(users.users[message.$match[3]].admin_level == 2) return message.reply('Отказ'); 
		vk.api.call("messages.removeChatUser", { chat_id: message.chatId, user_id: message.$match[3] }).
		catch((error) => {return message.send(`Error.`);}); 
		return  				
	} 
});

vk.updates.hear(/^(?:!warn)(\s?https\:\/\/vk\.com\/)?(id)?([0-9]+)?([^]+)?/i, (message) => { 
	let user = users.users[message.user];
	if(user.admin_level < 2) return;

	if(message.$match[4]) { 
		var domain = message.$match[4].split(" "); 
		vk.api.call("utils.resolveScreenName", { 
		screen_name: message.$match[4] 
	}).then((res) => { 
		new_user(res.object_id);
		if(users.users[res.object_id].admin_level == 2) return; 
		users.users[res.object_id].warn += 1;
		if(users.users[res.object_id].ban == true) return message.send(`Пользователь уже заблокирован`);
		if(users.users[res.object_id].warn >= 3){
			users.users[res.object_id].warn = 0;
			users.users[res.object_id].ban = true;
			vk.api.call("messages.removeChatUser", {chat_id: message.chatId, user_id: res.object_id })
			.catch((error) => {return message.send(`Error.`);
			});
			return message.send(`Пользователь vk.com/id${res.object_id} получил предупреждение 3/3`);
		}else{
			return message.send(`Пользователь vk.com/id${res.object_id} получил предупреждение ${users.users[res.object_id].warn}/3`);
		}

		})  
	}else{
		if(!message.$match[3]) return message.reply("ID пользователя не указан"); 
		new_user(message.$match[3]);
		users.users[message.$match[3]].warn += 1;
		if(users.users[message.$match[3]].ban == true) return message.send(`Пользователь уже заблокирован`);

		if(users.users[message.$match[3]].warn >= 3){
			users.users[message.$match[3]].warn = 0;
			users.users[message.$match[3]].ban = true;
			vk.api.call("messages.removeChatUser", {chat_id: message.chatId, user_id: message.$match[3] })
			.catch((error) => {return message.send(`Error.`);
			});
			return message.send(`Пользователь vk.com/id${message.$match[3]} получил предупреждение 3/3`);
		}else{
			return message.send(`Вы выдали предупреждение vk.com/id${message.$match[3]}.\nПосле 3-х предупреждений - выдается бан.`);
		}
	} 
});

vk.updates.hear(/^(?:!unwarn)(\s?https\:\/\/vk\.com\/)?(id)?([0-9]+)?([^]+)?/i, (message) => { 
	let user = users.users[message.user];
	if(user.admin_level < 2) return;

	if(message.$match[4]) { 
		var domain = message.$match[4].split(" "); 
		vk.api.call("utils.resolveScreenName", { 
		screen_name: message.$match[4] 
	}).then((res) => { 
		new_user(res.object_id);
		if(users.users[res.object_id].admin_level == 2) return; 
		users.users[res.object_id].warn = 0;
		return message.reply(`Вы сняли все варны у vk.com/id${res.object_id}`); 
		})  
	}else{
		if(!message.$match[3]) return message.reply("ID пользователя не указан"); 
		new_user(message.$match[3]);
		users.users[message.$match[3]].warn = 0;
		return message.reply(`Вы сняли все варны у vk.com/id${message.$match[3]}`);
	} 
});

vk.updates.hear(/^(?:!addmoder)(\s?https\:\/\/vk\.com\/)?(id)?([0-9]+)?([^]+)?/i, (message) => { 
	let user = users.users[message.user];
	if(user.admin_level < 2) return;

	if(message.$match[4]) { 
		var domain = message.$match[4].split(" "); 
		vk.api.call("utils.resolveScreenName", { 
		screen_name: message.$match[4] 
	}).then((res) => { 
		new_user(res.object_id);
		if(users.users[res.object_id].admin_level == 2) return;
		users.users[res.object_id].admin_level = 1;
		return message.send(`Пользователь vk.com/id${res.object_id} назначен модератором`);
		})  
	}else{
		if(!message.$match[3]) return message.reply("ID пользователя не указан"); 
		new_user(message.$match[3]);
		if(users.users[message.$match[3]].admin_level == 2) return;
		users.users[message.$match[3]].admin_level = 1;
		return message.send(`Пользователь vk.com/id${message.$match[3]} назначен модератором`);
	} 
});

vk.updates.hear(/^(?:!removemoder)(\s?https\:\/\/vk\.com\/)?(id)?([0-9]+)?([^]+)?/i, (message) => { 
	let user = users.users[message.user];
	if(user.admin_level < 2) return;

	if(message.$match[4]) { 
		var domain = message.$match[4].split(" "); 
		vk.api.call("utils.resolveScreenName", { 
		screen_name: message.$match[4] 
	}).then((res) => { 
		new_user(res.object_id);
		if(users.users[res.object_id].admin_level == 2) return; 
		users.users[res.object_id].admin_level = 0;
		return message.send(`vk.com/id${res.object_id} больше не модератор`);
		})  
	}else{
		if(!message.$match[3]) return message.reply("ID пользователя не указан"); 
		new_user(message.$match[3]);
		if(users.users[message.$match[3]].admin_level == 2) return;
		users.users[message.$match[3]].admin_level = 0;
		return message.send(`vk.com/id${message.$match[3]} больше не модератор`);
	} 
});

vk.updates.hear(/^(?:!ping)/i, (message) => { 
	return message.send(`pong`);
});

vk.updates.hear(/^(?:!даун)/i, (message) => { 
	return message.send(`мать ебал`);
});

vk.updates.hear(/^(?:!дз)/i, (message) => { 
	return message.send(`Ещё каникулы какое дз?`);
});

vk.updates.hear(/^(?:!инфо)/i, (message) => { 
	return message.send(`Важной инфы нет`);
});

vk.updates.hear(/^(?:!расписание)/i, (message) => { 
	return message.send(`Ещё каникулы ок да?`);
});

vk.updates.hear(/^(?:!расписание)/i, (message) => { 
	return message.send(`Ещё каникулы`);
});

vk.updates.hear(/^(?:!расписаниепонедельник)/i, (message) => { 
	return message.send(`Ещё каникулы`);
});

vk.updates.hear(/^(?:!расписаниевторник)/i, (message) => { 
	return message.send(`Ещё каникулы`);
});

vk.updates.hear(/^(?:!расписаниесреда)/i, (message) => { 
	return message.send(`Ещё каникулы`);
});

vk.updates.hear(/^(?:!расписаниечетверг)/i, (message) => { 
	return message.send(`Ещё каникулы`);
});

vk.updates.hear(/^(?:!расписаниепятница)/i, (message) => { 
	return message.send(`Ещё каникулы`);
});

vk.updates.hear(/^(?:!расписаниесуббота)/i, (message) => { 
	return message.send(`Ещё каникулы`);
});

vk.updates.hear(/^(?:!расписаниевоскресенье)/i, (message) => { 
	return message.send(`Выходной же...`);
});

vk.updates.hear(/^(?:!тест)/i, (message) => { 
	return message.send(`123${(Date.now() - message.createdTimestamp) / 1000}`);
});

/////////////////////////The script is redone and merged SEDIS////////////////////////////////

async function run() {
	await vk.updates.startPolling();
	console.log('Бот запущен!\nVersion 0.1\nThe script is redone and merged SEDIS');  
}

run().catch(console.error);
