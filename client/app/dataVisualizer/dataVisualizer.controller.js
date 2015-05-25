'use strict';

angular.module('julesApp')
  .controller('DataVisualizerCtrl', function ($scope, $http) {
    $scope.data;
    $scope.getData = function() {
      $http({
      method: 'GET',
      url: '/api/d3/usa',
    })
    	.then(function(res) {
    		console.log(res.data)
      		$scope.data = res.data
      		var stateData = {};
      		stateData.question = []
      		for (var i = 0; i < res.data.length; i++){
      			if(stateData[res.data[i].state] === undefined){
      				stateData[res.data[i].state] = 1
      			}
      			else{
      				stateData[res.data[i].state]++
      			}
      			stateData.question.push(res.data[i].questionText)
      		}
      		$scope.data = stateData;
      		function tooltipHtml(n, d){	/* function to create html content string in tooltip div. */
				return "<h4>"+n+"</h4><table>"+
					"<tr><td>Most common question</td><td>"+(d.question[2])+"</td></tr>"+
					"<tr><td>Number of Queries</td><td>"+(d.number)+"</td></tr>"+
					"</table>";
			}
			var states = ["HI", "AK", "FL", "SC", "GA", "AL", "NC", "TN", "RI", "CT", "MA",
			"ME", "NH", "VT", "NY", "NJ", "PA", "DE", "MD", "WV", "KY", "OH", 
			"MI", "WY", "MT", "ID", "WA", "DC", "TX", "CA", "AZ", "NV", "UT", 
			"CO", "NM", "OR", "ND", "SD", "NE", "IA", "MS", "IN", "IL", "MN", 
			"WI", "MO", "AR", "OK", "KS", "LS", "VA"]
			.forEach(function(d){ 
				var low=Math.round(100*Math.random()), 
					mid=Math.round(100*Math.random()), 
					high=Math.round(100*Math.random());
					var num = stateData[d];
					stateData[d] = {};
					stateData[d].name = d;
					stateData[d].question =stateData.question;
					stateData[d].number = num;
					stateData[d].color = d3.interpolate("#ffffcc", "#800026")(num/10)
			});
			uStates.draw("#statesvg", stateData, tooltipHtml)
   		 })
	}
    $scope.getData()
  })