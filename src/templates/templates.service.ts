import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UserPayload } from 'src/dto/createUser.dto'
import { FormCompetence } from 'src/models/formCompetencies.entitie'
import { FormTemplate } from 'src/models/formTemplates.emtitie'
import { Permissions } from 'src/models/permissions.entitie'
import { Roles } from 'src/models/users.entitie'
import { UserCheckService } from 'src/user-check/user-check.service'
import { In, Repository } from 'typeorm'
import { CreateTemplateDto } from './dto/templates.dto'

@Injectable()
export class TemplatesService {
    constructor(
        private readonly userCheckService: UserCheckService,

        @InjectRepository(FormTemplate)
        private templatesRepository: Repository<FormTemplate>,

        @InjectRepository(FormCompetence)
        private formCompetenciesRepository: Repository<FormCompetence>
    ) {}

    async getPositionTemplates(
        user: UserPayload,
        positionId: number
    ): Promise<{ templates: FormTemplate[]; connections: FormCompetence[] }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            await this.userCheckService.isPositionInOrganization(positionId, parrent.id)

            const getTemplates: FormTemplate[] = await this.templatesRepository.find({
                where: {
                    position: {
                        id: positionId,
                    },
                },
            })

            const getConnections: FormCompetence[] = await this.formCompetenciesRepository.find({
                where: {
                    formTemplate: {
                        id: In(getTemplates.map((item) => +item.id)),
                    },
                },
                relations: ['formTemplate', 'competence'],
            })

            return {
                templates: getTemplates.map((item) => ({ ...item, id: +item.id })),
                connections: getConnections.map((item) => ({
                    id: +item.id,
                    formTemplate: { ...item.formTemplate, id: +item.formTemplate.id },
                    competence: { ...item.competence, id: +item.competence.id },
                })),
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async createTemplate(user: UserPayload, positionId: number, body: CreateTemplateDto): Promise<FormTemplate> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const { findPosition } = await this.userCheckService.isPositionInOrganization(positionId, parrent.id)

            const newTemplate = new FormTemplate()
            newTemplate.name = body.name
            newTemplate.position = findPosition
            const createdTemplate = await this.templatesRepository.save(newTemplate)

            delete createdTemplate.position
            return { ...createdTemplate, id: +createdTemplate.id }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async editTemplate(
        user: UserPayload,
        positionId: number,
        templateId: number,
        body: CreateTemplateDto
    ): Promise<FormTemplate> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const { findTemplate } = await this.userCheckService.isTemplateInOrganization(templateId, parrent.id)

            await this.templatesRepository.update({ id: templateId }, body)

            const getUpdatedTemplate = await this.templatesRepository.findOne({
                where: {
                    id: findTemplate.id,
                    position: {
                        id: positionId,
                    },
                },
            })

            return { ...getUpdatedTemplate, id: +getUpdatedTemplate.id }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async deleteTemplate(user: UserPayload, templateId: number): Promise<{ id: number }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const { findTemplate } = await this.userCheckService.isTemplateInOrganization(templateId, parrent.id)

            await this.templatesRepository.delete({ id: templateId })

            return { id: +findTemplate.id }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async editConnection(
        user: UserPayload,
        templateId: number,
        competenceId: number
    ): Promise<
        | {
              mode: 'create'
              data: FormCompetence
          }
        | {
              mode: 'delete'
              data: { id: number }
          }
    > {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const { findTemplate } = await this.userCheckService.isTemplateInOrganization(templateId, parrent.id)
            const { findCompetence } = await this.userCheckService.isCompetenceInOrganization(competenceId, parrent.id)

            if (findTemplate.position.id !== findCompetence.position.id) {
                throw new ForbiddenException()
            }

            const findConnection = await this.formCompetenciesRepository.findOne({
                where: {
                    competence: {
                        id: findCompetence.id,
                    },
                    formTemplate: {
                        id: findTemplate.id,
                    },
                },
            })

            let mode: 'create' | 'delete' = 'delete'
            let data = null

            if (findConnection) {
                mode = 'delete'
                await this.formCompetenciesRepository.delete({
                    id: findConnection.id,
                })
                data = { id: +findConnection.id }
            } else {
                mode = 'create'
                const newConnection = new FormCompetence()
                newConnection.competence = findCompetence
                newConnection.formTemplate = findTemplate
                const savedConnection = await this.formCompetenciesRepository.save(newConnection)
                data = {
                    id: +savedConnection.id,
                    competence: {
                        id: +savedConnection.competence.id,
                        name: savedConnection.competence.name,
                    },
                    formTemplate: {
                        id: +savedConnection.formTemplate.id,
                        name: savedConnection.formTemplate.name,
                    },
                }
            }

            return { mode, data }
        } catch (e) {
            console.log(e)
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }
}
