import api from "../../../api/api";
import type { APIResource } from "../../../api/types/api-resource";
import type { CheckOrgAvailabilityRequest, CheckOrgAvailabilityResponse } from "./types";

export const OrgService = {
  /**
   * Check if organization name is available.
   * URI: http://syncio.site/api/v1/orgs/availability?name=
   */
  checkAvailability: async (request: CheckOrgAvailabilityRequest): Promise<APIResource<CheckOrgAvailabilityResponse>> => {
    const response = await api.get<APIResource<CheckOrgAvailabilityResponse>>(
      `orgs/availability?name=${encodeURIComponent(request.name)}`
    );
    return response.data;
  }
};