<?php
declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Illuminate\Database\Capsule\Manager as Capsule;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require __DIR__ . '/../vendor/autoload.php';


$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

$app = AppFactory::create();

$app->addBodyParsingMiddleware();

$errorMiddleware = $app->addErrorMiddleware((bool)($_ENV['APP_DEBUG'] ?? true), true, true);


$capsule = new Capsule;
$capsule->addConnection([
    'driver'    => $_ENV['DB_DRIVER'] ?? 'mysql',
    'host'      => $_ENV['DB_HOST'] ?? '127.0.0.1',
    'database'  => $_ENV['DB_NAME'] ?? 'vuelos_app',
    'username'  => $_ENV['DB_USER'] ?? 'root',
    'password'  => $_ENV['DB_PASS'] ?? '',
    'charset'   => 'utf8',
    'collation' => 'utf8_unicode_ci',
    'prefix'    => '',
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();


try {
    Capsule::connection()->getPdo();
    
} catch (\Exception $e) {
    echo "Error en conexión a base de datos: " . $e->getMessage();
    exit;  
}
$app->add(function ($request, $handler) {
    $origin = $request->getHeaderLine('Origin') ?: '*';
    $allowedOrigins = [
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ];

  
    if ($request->getMethod() === 'OPTIONS') {
        $response = new \Slim\Psr7\Response();
        if (in_array($origin, $allowedOrigins)) {
            return $response
                ->withHeader('Access-Control-Allow-Origin', $origin)
                ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->withHeader('Access-Control-Allow-Credentials', 'true')
                ->withStatus(200);
        }
        return $response->withStatus(403);
    }

    $response = $handler->handle($request);

    if (in_array($origin, $allowedOrigins)) {
        return $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Credentials', 'true');
    }

    return $response;
});

$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});

$app->add(function (Request $request, $handler) {
    $path = $request->getUri()->getPath();

    
    $publicPaths = ['/login', '/register', '/'];
    foreach ($publicPaths as $p) {
        if ($p === $path || (stripos($path, $p) !== false && $p !== '/')) {
            return $handler->handle($request);
        }
    }

    $authHeader = $request->getHeaderLine('Authorization');
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $res = new \Slim\Psr7\Response();
        $res->getBody()->write(json_encode(['error' => 'Authorization header no válido']));
        return $res->withStatus(401)->withHeader('Content-Type','application/json');
    }

    $token = $matches[1];
    $secret = $_ENV['JWT_SECRET'] ?? '';
    $alg = $_ENV['JWT_ALGO'] ?? 'HS256';

    try {
        $decoded = JWT::decode($token, new Key($secret, $alg));
        $request = $request->withAttribute('jwt', $decoded);

        if (isset($decoded->sub)) {
            $user = App\Models\User::find((int)$decoded->sub);
            if (!$user) {
                $res = new \Slim\Psr7\Response();
                $res->getBody()->write(json_encode(['error' => 'Usuario no encontrado']));
                return $res->withStatus(401)->withHeader('Content-Type','application/json');
            }
            $request = $request->withAttribute('user', $user);
        }

        return $handler->handle($request);

    } catch (\Firebase\JWT\ExpiredException $e) {
        $res = new \Slim\Psr7\Response();
        $res->getBody()->write(json_encode(['error' => 'Token expirado']));
        return $res->withStatus(401)->withHeader('Content-Type','application/json');
    } catch (\Exception $e) {
        $res = new \Slim\Psr7\Response();
        $res->getBody()->write(json_encode(['error' => 'Token inválido', 'msg' => $e->getMessage()]));
        return $res->withStatus(401)->withHeader('Content-Type','application/json');
    }
});


$app->get('/', function (Request $request, Response $response) {
    $response->getBody()->write('Users microservice (JWT) OK');
    return $response;
});


$sendJson = function(Response $res, $payload, $status = 200) {
    $res->getBody()->write(json_encode($payload));
    return $res->withHeader('Content-Type','application/json')->withStatus($status);
};

$app->post('/register', function (Request $request, Response $response) use ($sendJson) {
    $data = (array)$request->getParsedBody();

    if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
        return $sendJson($response, ['error' => 'Campos incompletos'], 400);
    }

    
    if (App\Models\User::where('email', $data['email'])->exists()) {
        return $sendJson($response, ['error' => 'Email ya registrado'], 400);
    }

    $user = App\Models\User::create([
        'name' => $data['name'],
        'email' => $data['email'],
        'password' => password_hash($data['password'], PASSWORD_BCRYPT),
        'role' => $data['role'] ?? 'gestor'
    ]);

    return $sendJson($response, $user->only(['id','name','email','role']), 201);
});


$app->post('/login', function (Request $request, Response $response) use ($sendJson) {
    $data = (array)$request->getParsedBody();
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    $user = App\Models\User::where('email', $email)->first();
    if (!$user) {
        return $sendJson($response, ['error' => 'Usuario no encontrado'], 401);
    }

    
    $passwordOk = password_verify($password, $user->password);
    if (!$passwordOk) {
        return $sendJson($response, ['error' => 'Contraseña invalida'], 401);
    }

    $now = time();
    $expire = $now + (int)($_ENV['JWT_EXPIRE_SECONDS'] ?? 3600);
    $payload = [
        'iss' => $_ENV['APP_URL'] ?? 'http://127.0.0.1',
        'aud' => $_ENV['APP_URL'] ?? 'http://127.0.0.1',
        'iat' => $now,
        'exp' => $expire,
        'sub' => $user->id,
        'role' => $user->role,
        'email' => $user->email,
    ];

    $secret = $_ENV['JWT_SECRET'] ?? '';
    $alg = $_ENV['JWT_ALGO'] ?? 'HS256';
    $token = JWT::encode($payload, $secret, $alg);

    return $sendJson($response, [
        'token' => $token,
        'expires_at' => date('c', $expire),
        'user' => $user->only(['id','name','email','role'])
    ]);
});

$app->post('/logout', function (Request $request, Response $response) use ($sendJson) {
    return $sendJson($response, ['ok' => true, 'note' => 'Elimina el token en el cliente. Para invalidar en servidor usa blacklist.']);
});


$app->get('/users', function (Request $request, Response $response) use ($sendJson) {
    /** @var App\Models\User $authUser */
    $authUser = $request->getAttribute('user');

    if (!$authUser || $authUser->role !== 'administrador') {
        return $sendJson($response, ['error' => 'No autorizado'], 403);
    }

    $users = App\Models\User::all(['id','name','email','role','created_at']);
    return $sendJson($response, $users);
});


$app->put('/users/{id}', function (Request $request, Response $response, array $args) use ($sendJson) {
    $authUser = $request->getAttribute('user');
    if (!$authUser || $authUser->role !== 'administrador') {
        return $sendJson($response, ['error' => 'No autorizado'], 403);
    }

    $id = (int)$args['id'];
    $data = (array)$request->getParsedBody();

    $user = App\Models\User::find($id);
    if (!$user) {
        return $sendJson($response, ['error' => 'Usuario no encontrado'], 404);
    }

    
    $user->name = $data['name'] ?? $user->name;
    $user->role = $data['role'] ?? $user->role;
    $user->save();

    return $sendJson($response, $user->only(['id','name','email','role']));
});

$app->run();
