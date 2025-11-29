<?php
declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Illuminate\Database\Capsule\Manager as Capsule;
use App\Models\Flight;
use App\Models\Nave;
use App\Models\Reservation;
use App\Models\User;


use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require __DIR__ . '/../vendor/autoload.php';


$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

$app = AppFactory::create();
$app->setBasePath('/vuelos_flights_ms/public');

$app->addRoutingMiddleware();
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

$app->add(function ($request, $handler) {
    $origin = $request->getHeaderLine('Origin') ?: '*';
    $allowedOrigins = [
        'http://localhost:5500', 
        'http://127.0.0.1:5500'
    ];

    if (in_array($origin, $allowedOrigins)) {
        $response = $handler->handle($request);
        return $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Credentials', 'true');
    }

    
    $response = $handler->handle($request);
    return $response;
});


$app->options('/{routes:.+}', fn($req, $res) => $res);
$app->add(function (Request $request, $handler) {
    $origin = $request->getHeaderLine('Origin') ?: '*';
    $response = $handler->handle($request);
    $response = $response
        ->withHeader('Access-Control-Allow-Origin', $origin)
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Credentials', 'true');
    if ($request->getMethod() === 'OPTIONS') {
        return $response->withStatus(200);
    }
    return $response;
});

$app->add(function (Request $request, $handler) {
    $routeContext = \Slim\Routing\RouteContext::fromRequest($request);
    $route = $routeContext->getRoute();

    
    $publicPaths = ['/public', '/health'];
    $path = $request->getUri()->getPath();
    foreach ($publicPaths as $p) {
        if (stripos($path, $p) !== false) {
            return $handler->handle($request);
        }
    }

    $authHeader = $request->getHeaderLine('Authorization');

    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return self::unauthorized("Falta token");
    }

    $token = $matches[1];

   
    try {
        $secret = $_ENV['JWT_SECRET'] ?? 'secret123';
        $decoded = JWT::decode($token, new Key($secret, 'HS256'));

       
        $user = User::find($decoded->sub ?? 0);
        if (!$user) {
            return self::unauthorized("Usuario no existe");
        }

        $request = $request->withAttribute('user', $user);
        return $handler->handle($request);

    } catch (\Throwable $e) {
        
    }

    
    $user = User::where('token', $token)->first();
    if (!$user) {
        return self::unauthorized("Token inválido o expirado");
    }

    $request = $request->withAttribute('user', $user);
    return $handler->handle($request);
});


function unauthorized(string $msg = "No autorizado") {
    $res = new \Slim\Psr7\Response();
    $res->getBody()->write(json_encode(['error' => $msg]));
    return $res->withStatus(401)->withHeader('Content-Type','application/json');
}


$app->get('/', function (Request $req, Response $res) {
    $res->getBody()->write('Flights microservice OK');
    return $res;
});


$app->post('/naves', function (Request $req, Response $res) {
    $user = $req->getAttribute('user');
    if ($user->role !== 'administrador') {
        $res2 = $res->withStatus(403)->withHeader('Content-Type','application/json');
        $res2->getBody()->write(json_encode(['error' => 'No autorizado']));
        return $res2;
    }
    $data = (array)$req->getParsedBody();
    $nave = App\Models\Nave::create($data);
    $res->getBody()->write($nave->toJson());
    return $res->withHeader('Content-Type','application/json');
});



$app->get('/naves', function (Request $req, Response $res) {
    $naves = App\Models\Nave::all();
    $res->getBody()->write($naves->toJson());
    return $res->withHeader('Content-Type','application/json');
});

$app->put('/naves/{id}', function (Request $req, Response $res, $args) {
    $user = $req->getAttribute('user');
    if ($user->role !== 'administrador') return $res->withStatus(403);
    $nave = App\Models\Nave::find((int)$args['id']);
    if (!$nave) return $res->withStatus(404);
    $nave->fill((array)$req->getParsedBody());
    $nave->save();
    $res->getBody()->write($nave->toJson());
    return $res->withHeader('Content-Type','application/json');
});
$app->delete('/naves/{id}', function (Request $req, Response $res, $args) {
    $user = $req->getAttribute('user');
    if ($user->role !== 'administrador') return $res->withStatus(403);
    $nave = App\Models\Nave::find((int)$args['id']);
    if (!$nave) return $res->withStatus(404);
    $nave->delete();
    return $res->withStatus(204);
});


$app->post('/vuelos', function (Request $req, Response $res) {
    $user = $req->getAttribute('user');
    if ($user->role !== 'administrador') return $res->withStatus(403);
    $data = (array)$req->getParsedBody();
    $nave = App\Models\Nave::find($data['nave_id'] ?? 0);
    if (!$nave) {
        $res->getBody()->write(json_encode(['error'=>'Nave inválida']));
        return $res->withStatus(400)->withHeader('Content-Type','application/json');
    }
    $flight = App\Models\Flight::create($data);
    $res->getBody()->write($flight->toJson());
    return $res->withHeader('Content-Type','application/json');
});

$app->get('/vuelos', function (Request $req, Response $res) {
    $query = App\Models\Flight::query();
    $params = $req->getQueryParams();
    if (!empty($params['origin'])) $query->where('origin','like','%'.$params['origin'].'%');
    if (!empty($params['destination'])) $query->where('destination','like','%'.$params['destination'].'%');
    if (!empty($params['date'])) {
        $date = $params['date'];
        $query->whereDate('departure', $date);
    }
    $flights = $query->get();
    $res->getBody()->write($flights->toJson());
    return $res->withHeader('Content-Type','application/json');
});

$app->put('/vuelos/{id}', function (Request $req, Response $res, $args) {
    $user = $req->getAttribute('user');
    if ($user->role !== 'administrador') return $res->withStatus(403);
    $flight = App\Models\Flight::find((int)$args['id']);
    if (!$flight) return $res->withStatus(404);
    $flight->fill((array)$req->getParsedBody());
    $flight->save();
    $res->getBody()->write($flight->toJson());
    return $res->withHeader('Content-Type','application/json');
});

$app->delete('/vuelos/{id}', function (Request $req, Response $res, $args) {
    $user = $req->getAttribute('user');
    if ($user->role !== 'administrador') return $res->withStatus(403);
    $flight = App\Models\Flight::find((int)$args['id']);
    if (!$flight) return $res->withStatus(404);
    $flight->delete();
    return $res->withStatus(204);
});


$app->post('/reservas', function (Request $req, Response $res) {
    $user = $req->getAttribute('user');
    if ($user->role !== 'gestor') return $res->withStatus(403);
    $data = (array)$req->getParsedBody();
    $flight = App\Models\Flight::find($data['flight_id'] ?? 0);
    if (!$flight) {
        $res->getBody()->write(json_encode(['error' => 'Vuelo no existe']));
        return $res->withStatus(400)->withHeader('Content-Type','application/json');
    }
    $reservation = App\Models\Reservation::create([
        'user_id' => $user->id,
        'flight_id' => $flight->id,
        'status' => 'activa'
    ]);
    $res->getBody()->write($reservation->toJson());
    return $res->withHeader('Content-Type','application/json');
});
$app->get('/reservas', function (Request $req, Response $res) {
    $user = $req->getAttribute('user');
    if ($user->role === 'administrador') {
        $reservas = App\Models\Reservation::all();
    } else {
        $reservas = App\Models\Reservation::where('user_id', $user->id)->get();
    }
    $res->getBody()->write($reservas->toJson());
    return $res->withHeader('Content-Type','application/json');
});

$app->post('/reservas/{id}/cancel', function (Request $req, Response $res, $args) {
    $user = $req->getAttribute('user');
    if ($user->role !== 'gestor') return $res->withStatus(403);
    $reserva = App\Models\Reservation::find((int)$args['id']);
    if (!$reserva) return $res->withStatus(404);
    if ($reserva->user_id !== $user->id && $user->role !== 'administrador') {
        return $res->withStatus(403);
    }
    $reserva->status = 'cancelada';
    $reserva->save();
    $res->getBody()->write($reserva->toJson());
    return $res->withHeader('Content-Type','application/json');
});

$app->run();