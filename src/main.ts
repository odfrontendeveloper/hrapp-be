import {
    ArgumentMetadata,
    BadRequestException,
    HttpException,
    HttpStatus,
    UnprocessableEntityException,
    ValidationPipe,
} from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { INCORRECT_DATA } from './constants'

class ValidationPipeCustom extends ValidationPipe {
    public async transform(value, metadata: ArgumentMetadata) {
        try {
            return await super.transform(value, metadata)
        } catch (e) {
            if (e instanceof BadRequestException) {
                throw new UnprocessableEntityException(INCORRECT_DATA)
            }
        }
    }
}

async function bootstrap() {
    const app = await NestFactory.create(AppModule)
    app.enableCors()
    app.useGlobalPipes(new ValidationPipeCustom())
    await app.listen(8080)
}

try {
    bootstrap()
} catch (e) {
    throw new HttpException(e, HttpStatus.BAD_REQUEST)
}
