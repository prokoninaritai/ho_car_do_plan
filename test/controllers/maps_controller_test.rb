require "test_helper"

class MapsControllerTest < ActionDispatch::IntegrationTest
  test "should get dashboard" do
    get maps_dashboard_url
    assert_response :success
  end
end
