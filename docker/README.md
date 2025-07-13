# Secure Application Stack: ModSecurity + Node.js + Vault

## Состав проекта

Сборка включает в себя три контейнера:

### 1. **ModSecurity + Nginx (WAF)**

- Используется в качестве обратного прокси.
- Защищает приложение от распространённых уязвимостей (SQLi, XSS, и др.).
- Работает с ModSecurity и Core Rule Set (CRS).
- Проксирует запросы на приложение `node`.

### 2. **Node.js приложение + SQLite**

- Основное веб-приложение.
- Использует SQLite как встроенную базу данных.
- Переменные окружения для GOOGLE & JWT получаются из Vault.
- Приложение полноценно запускается только после успешного получения данных из Vault.

### 3. **HashiCorp Vault**

- Используется для безопасного хранения конфиденциальных данных (секретов).
- Запускается в Docker-контейнере с инициализацией и распечатыванием вручную.
- Предоставляет доступ к данным через токены/политику.

---

## Схема взаимодействия

[Клиент] ──► [Nginx + ModSecurity] ──► [Node.js App + SQLite] ◄──► [Vault]

## Сборка всего

- из корня проекта "cd ./docker/vault"
- распаковываем архив "tar -xzf data.tar.gz" и проверяем что есть папка data с содержимым
- переходим в nginx_modsecurity "cd ../nginx_modsecurity"
- скачиваем правила "./rules.sh" (CRS), проверяем наличие папки rules с содержимым (нас будет интересовать rules/rules) 
- переходим в docker "cd .."
- "make"
- проверяем что все поднялось "docker container ls"
	..	IMAGE                      COMMAND                  PORTS                                           NAMES
		docker-node_sqlite         "/home/node/run.sh"														node_sqlite
		docker-nginx_modsecurity   "/docker-entrypoint.…"	0.0.0.0:8443->8443/tcp, [::]:8443->8443/tcp		nginx_modsecurity
		docker-vault               "docker-entrypoint.s…"													vault

## Распечатываем Vault

- make sh vault
- в шеле выполнить (ключи в репозитории не сохранены!):
	vault operator unseal первый ключ
	vault operator unseal второй ключ
	vault operator unseal третий ключ

	должны увидеть подобный результат:
		Key             Value
		---             -----
		Seal Type       shamir
		Initialized     true
		Sealed          false		✅ - видим что Vault распечатан
		Total Shares    5
		...
- exit

## Перезапускаем приложение

- docker container restart node_sqlite
- смотрим логи что приложение запустилось (содержимое лога в части "Server listening at" может отличаться!):
	docker container logs node_sqlite
		...
		node .

		✅ Database opened successfully
		BJS - [15:02:50]: Babylon.js v8.16.1 - Null engine
		{"level":30,"time":1752418970103,"pid":166,"hostname":"0585b46c580e","msg":"Server listening at https://127.0.0.1:12800"}
		{"level":30,"time":1752418970103,"pid":166,"hostname":"0585b46c580e","msg":"Server listening at https://172.18.0.3:12800"}
		{"level":30,"time":1752418970103,"pid":166,"hostname":"0585b46c580e","msg":"Server listening at https://172.19.0.2:12800"}
